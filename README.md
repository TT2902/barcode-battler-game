# 📱 Barcode Battler Game

A modern web-based game inspired by Barcode Battler II, where players scan barcodes to generate unique digital creatures and battle them in strategic turn-based combat.

## 🎮 How to Play

1. **Scan Barcodes**: Use your device's camera or enter barcodes manually
2. **Collect Creatures**: Each barcode generates a unique creature with different stats
3. **Battle**: Engage in turn-based battles against AI opponents
4. **Level Up**: Win battles to gain experience and level up your creatures
5. **Progress**: Unlock higher difficulty levels as you improve

## ✨ Features

- 📱 **Camera Barcode Scanning**: Real-time barcode detection using device camera
- 🎯 **Deterministic Generation**: Same barcode always creates the same creature
- ⚔️ **Strategic Combat**: Turn-based battles with attack, special, and defend actions
- 🏆 **Difficulty Progression**: Easy, Medium, and Hard difficulty levels
- 📊 **Collection Management**: Sort and manage your creature collection
- ♿ **Accessibility**: Full WCAG compliance with screen reader support
- 📱 **PWA Support**: Install as an app on mobile devices
- 🔄 **Offline Play**: Works without internet connection

## 🚀 Quick Start

### Play Online
Visit the live game at: [Your deployed URL here]

### Run Locally
```bash
# Clone the repository
git clone [your-repo-url]
cd barcode-battler-game

# Start a local server
python -m http.server 8000
# or
npx serve .

# Open in browser
open http://localhost:8000
```

## 🛠️ Technical Details

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Libraries**: QuaggaJS for barcode scanning, Web Audio API for sound
- **Storage**: LocalStorage for offline data persistence
- **PWA**: Service Worker for offline functionality
- **Testing**: Comprehensive test suite included

## 📁 Project Structure

```
barcode-battler-game/
├── index.html              # Main game page
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── styles/
│   └── main.css           # Game styles
├── js/
│   ├── main.js            # Main UI controller
│   ├── barcode-processor.js # Barcode processing
│   ├── creature-manager.js # Creature management
│   ├── battle-engine.js   # Battle system
│   └── ...               # Other game modules
├── tests/                 # Test files
└── icons/                # PWA icons
```

## 🎯 Game Mechanics

### Creature Generation
- Barcodes are processed using a deterministic algorithm
- Stats (HP, Attack, Defense, Speed) are calculated from barcode digits
- Names are generated using syllable combinations
- Same barcode always produces identical creatures

### Battle System
- Turn order determined by Speed stat
- Damage calculation: `(Attack × Multiplier) - Defense + Variance`
- Critical hits based on creature level
- Special attacks with increased damage multipliers

### Difficulty Progression
- **Easy**: 80% opponent stats, unlocked by default
- **Medium**: 100% opponent stats, unlocked after 5 easy wins
- **Hard**: 130% opponent stats, unlocked after 15 total wins + 8 medium wins

## 🧪 Testing

Run the test suite by opening `test-runner.html` in your browser.

Test categories:
- Unit tests for all game modules
- Integration tests for system interactions
- Performance tests for large collections
- Accessibility compliance tests
- Cross-browser compatibility tests
- End-to-end user journey tests

## 📱 Mobile Support

The game is optimized for mobile devices with:
- Touch-friendly interface
- Camera barcode scanning
- Responsive design
- PWA installation support
- Offline functionality

## ♿ Accessibility

Full accessibility support including:
- ARIA labels and landmarks
- Keyboard navigation
- Screen reader compatibility
- High contrast mode
- Large text mode
- Reduced motion support

## 🔧 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- Mobile browsers with camera support

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🎉 Credits

Inspired by the classic Barcode Battler II handheld game.
Built with modern web technologies for a new generation of players.

---

**Ready to battle? Scan your first barcode and start your collection!** 📱⚔️