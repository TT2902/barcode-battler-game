/**
 * CameraScanner - Handles camera-based barcode scanning using QuaggaJS
 * Provides camera access, barcode detection, and fallback handling
 */

class CameraScanner {
    constructor() {
        this.isInitialized = false;
        this.isScanning = false;
        this.hasCamera = false;
        this.stream = null;
        this.onBarcodeDetectedCallback = null;
        this.onErrorCallback = null;
        this.scanCount = 0;
        this.lastScannedBarcode = null;
        this.scanConfidenceThreshold = 0.75;
        this.duplicateScanDelay = 2000; // 2 seconds
        
        // Check if QuaggaJS is available
        this.isQuaggaAvailable = typeof Quagga !== 'undefined';
        
        if (!this.isQuaggaAvailable) {
            console.warn('QuaggaJS library not loaded. Camera scanning will not be available.');
        }
    }

    /**
     * Check if camera scanning is supported
     * @returns {boolean} Whether camera scanning is supported
     */
    isSupported() {
        return this.isQuaggaAvailable && 
               navigator.mediaDevices && 
               navigator.mediaDevices.getUserMedia;
    }

    /**
     * Initialize camera scanner
     * @param {string} videoElementId - ID of video element for camera feed
     * @returns {Promise<boolean>} Whether initialization was successful
     */
    async initialize(videoElementId = 'camera-video') {
        if (!this.isSupported()) {
            console.warn('Camera scanning not supported on this device/browser');
            return false;
        }

        try {
            this.videoElement = document.getElementById(videoElementId);
            if (!this.videoElement) {
                throw new Error(`Video element with ID '${videoElementId}' not found`);
            }

            // Check camera availability
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            this.hasCamera = videoDevices.length > 0;

            if (!this.hasCamera) {
                throw new Error('No camera devices found');
            }

            this.isInitialized = true;
            console.log('Camera scanner initialized successfully');
            return true;

        } catch (error) {
            console.error('Failed to initialize camera scanner:', error);
            this.handleError('initialization', error);
            return false;
        }
    }

    /**
     * Start camera scanning
     * @returns {Promise<boolean>} Whether scanning started successfully
     */
    async startScanning() {
        if (!this.isInitialized) {
            console.error('Camera scanner not initialized');
            return false;
        }

        if (this.isScanning) {
            console.warn('Camera scanning already active');
            return true;
        }

        try {
            // Request camera permission and start stream
            await this.requestCameraPermission();

            // Configure QuaggaJS
            const config = this.getQuaggaConfig();
            
            return new Promise((resolve, reject) => {
                Quagga.init(config, (error) => {
                    if (error) {
                        console.error('QuaggaJS initialization failed:', error);
                        this.handleError('quagga_init', error);
                        reject(error);
                        return;
                    }

                    // Set up barcode detection handler
                    Quagga.onDetected(this.handleBarcodeDetected.bind(this));
                    
                    // Set up processing handler for visual feedback
                    Quagga.onProcessed(this.handleFrameProcessed.bind(this));

                    // Start scanning
                    Quagga.start();
                    this.isScanning = true;
                    this.scanCount = 0;
                    
                    console.log('Camera scanning started');
                    resolve(true);
                });
            });

        } catch (error) {
            console.error('Failed to start camera scanning:', error);
            this.handleError('start_scanning', error);
            return false;
        }
    }

    /**
     * Stop camera scanning
     */
    stopScanning() {
        if (!this.isScanning) {
            return;
        }

        try {
            if (this.isQuaggaAvailable && typeof Quagga.stop === 'function') {
                Quagga.stop();
                Quagga.offDetected();
                Quagga.offProcessed();
            }

            // Stop camera stream
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }

            this.isScanning = false;
            this.lastScannedBarcode = null;
            
            console.log('Camera scanning stopped');

        } catch (error) {
            console.error('Error stopping camera scanner:', error);
        }
    }

    /**
     * Request camera permission
     * @returns {Promise<MediaStream>} Camera stream
     */
    async requestCameraPermission() {
        try {
            const constraints = {
                video: {
                    facingMode: 'environment', // Prefer back camera
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            return this.stream;

        } catch (error) {
            // Try with front camera if back camera fails
            if (error.name === 'OverconstrainedError' || error.name === 'NotFoundError') {
                try {
                    const fallbackConstraints = {
                        video: {
                            width: { ideal: 640 },
                            height: { ideal: 480 }
                        }
                    };
                    
                    this.stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
                    return this.stream;
                } catch (fallbackError) {
                    throw fallbackError;
                }
            }
            throw error;
        }
    }

    /**
     * Get QuaggaJS configuration
     * @returns {Object} QuaggaJS configuration object
     */
    getQuaggaConfig() {
        return {
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: this.videoElement,
                constraints: {
                    width: 640,
                    height: 480,
                    facingMode: "environment"
                }
            },
            locator: {
                patchSize: "medium",
                halfSample: true
            },
            numOfWorkers: 2,
            frequency: 10,
            decoder: {
                readers: [
                    "code_128_reader",
                    "ean_reader",
                    "ean_8_reader",
                    "code_39_reader",
                    "code_39_vin_reader",
                    "codabar_reader",
                    "upc_reader",
                    "upc_e_reader",
                    "i2of5_reader"
                ]
            },
            locate: true
        };
    }

    /**
     * Handle barcode detection
     * @param {Object} result - QuaggaJS detection result
     */
    handleBarcodeDetected(result) {
        if (!result || !result.codeResult) {
            return;
        }

        const code = result.codeResult.code;
        const confidence = result.codeResult.confidence || 0;

        // Filter out low-confidence detections
        if (confidence < this.scanConfidenceThreshold) {
            return;
        }

        // Prevent duplicate scans of the same barcode
        if (this.lastScannedBarcode === code) {
            return;
        }

        // Validate barcode format
        if (!this.isValidBarcodeFormat(code)) {
            return;
        }

        this.lastScannedBarcode = code;
        this.scanCount++;

        console.log(`Barcode detected: ${code} (confidence: ${confidence.toFixed(2)})`);

        // Provide haptic feedback if available
        this.provideHapticFeedback();

        // Call the callback
        if (this.onBarcodeDetectedCallback) {
            this.onBarcodeDetectedCallback(code, {
                confidence: confidence,
                scanCount: this.scanCount,
                format: result.codeResult.format
            });
        }

        // Reset duplicate prevention after delay
        setTimeout(() => {
            if (this.lastScannedBarcode === code) {
                this.lastScannedBarcode = null;
            }
        }, this.duplicateScanDelay);
    }

    /**
     * Handle frame processing for visual feedback
     * @param {Object} result - QuaggaJS processing result
     */
    handleFrameProcessed(result) {
        const drawingCtx = Quagga.canvas.ctx.overlay;
        const drawingCanvas = Quagga.canvas.dom.overlay;

        if (result) {
            // Clear previous drawings
            drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

            // Draw detection boxes
            if (result.boxes) {
                drawingCtx.strokeStyle = "green";
                drawingCtx.lineWidth = 2;
                
                result.boxes.filter(box => box !== result.box).forEach(box => {
                    Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { color: "green", lineWidth: 2 });
                });
            }

            // Draw the main detection box
            if (result.box) {
                drawingCtx.strokeStyle = "blue";
                drawingCtx.lineWidth = 3;
                Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { color: "blue", lineWidth: 3 });
            }

            // Draw the barcode line
            if (result.codeResult && result.codeResult.code) {
                drawingCtx.strokeStyle = "red";
                drawingCtx.lineWidth = 3;
                Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: 'red', lineWidth: 3 });
            }
        }
    }

    /**
     * Check if barcode format is valid
     * @param {string} code - Barcode string
     * @returns {boolean} Whether the barcode format is valid
     */
    isValidBarcodeFormat(code) {
        // Check if it's a string and has reasonable length
        if (typeof code !== 'string' || code.length < 8 || code.length > 20) {
            return false;
        }

        // Check if it contains only digits
        return /^\d+$/.test(code);
    }

    /**
     * Provide haptic feedback if available
     */
    provideHapticFeedback() {
        if (navigator.vibrate) {
            navigator.vibrate(100); // Short vibration
        }
    }

    /**
     * Set callback for barcode detection
     * @param {Function} callback - Callback function (barcode, metadata) => void
     */
    onBarcodeDetected(callback) {
        this.onBarcodeDetectedCallback = callback;
    }

    /**
     * Set callback for errors
     * @param {Function} callback - Error callback function (type, error) => void
     */
    onError(callback) {
        this.onErrorCallback = callback;
    }

    /**
     * Handle errors
     * @param {string} type - Error type
     * @param {Error} error - Error object
     */
    handleError(type, error) {
        console.error(`Camera scanner error (${type}):`, error);
        
        if (this.onErrorCallback) {
            this.onErrorCallback(type, error);
        }
    }

    /**
     * Get scanner status
     * @returns {Object} Scanner status information
     */
    getStatus() {
        return {
            isSupported: this.isSupported(),
            isInitialized: this.isInitialized,
            isScanning: this.isScanning,
            hasCamera: this.hasCamera,
            scanCount: this.scanCount,
            lastScannedBarcode: this.lastScannedBarcode
        };
    }

    /**
     * Toggle camera scanning
     * @returns {Promise<boolean>} Whether the operation was successful
     */
    async toggle() {
        if (this.isScanning) {
            this.stopScanning();
            return false;
        } else {
            return await this.startScanning();
        }
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.stopScanning();
        this.onBarcodeDetectedCallback = null;
        this.onErrorCallback = null;
        this.videoElement = null;
    }
}

// Export for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CameraScanner;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.CameraScanner = CameraScanner;
}