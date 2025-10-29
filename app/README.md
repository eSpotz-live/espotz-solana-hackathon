# Espotz Frontend - React Application

A comprehensive React frontend for the Espotz decentralized esports tournament platform on Solana.

## 🚀 Features

### Core Functionality
- **Wallet Integration** - Connect Phantom, Solflare, and other Solana wallets
- **Tournament Management** - Create, view, and manage tournaments
- **Player Registration** - Register for tournaments with USDC entry fees
- **Admin Dashboard** - Tournament operator controls and result submission
- **Real-time Updates** - Live tournament status and player counts
- **Responsive Design** - Mobile-first design with TailwindCSS
- **Transaction Monitoring** - Track on-chain transactions with status indicators

### Technical Stack
- **React 18** - Modern UI framework with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Solana Wallet Adapter** - Unified wallet connection
- **Anchor Client** - Generated TypeScript client from smart contract IDL
- **Zustand** - Lightweight state management
- **Lucide React** - Beautiful icon library
- **React Router** - Client-side routing

## 📁 Project Structure

```
app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.tsx
│   │   ├── WalletButton.tsx
│   │   └── ToastContainer.tsx
│   ├── contexts/           # React contexts
│   │   └── WalletContext.tsx
│   ├── lib/               # Utilities and constants
│   │   ├── constants.ts
│   │   ├── utils.ts
│   │   └── vite-env.d.ts
│   ├── pages/             # Page components
│   │   ├── HomePage.tsx
│   │   ├── TournamentsPage.tsx
│   │   ├── TournamentDetailPage.tsx
│   │   ├── CreateTournamentPage.tsx
│   │   ├── AdminPage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── NotFoundPage.tsx
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx           # Main app component
│   ├── main.tsx           # App entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── package.json           # Dependencies and scripts
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.js     # TailwindCSS configuration
├── postcss.config.js      # PostCSS configuration
└── README.md             # This file
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+ and npm
- Solana wallet (Phantom, Solflare, etc.)
- Git for version control

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd espotz-solana/app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Solana Network
VITE_RPC_ENDPOINT=https://api.devnet.solana.com
VITE_NETWORK=devnet

# Smart Contract
VITE_PROGRAM_ID=YOUR_PROGRAM_ID_HERE
VITE_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3G1e5KPws3

# Application
VITE_APP_NAME=Espotz Tournaments
VITE_APP_DESCRIPTION=Decentralized esports tournaments on Solana
```

### Network Configuration

The app supports multiple Solana networks:

- **Devnet** - Testing network with free SOL airdrops
- **Mainnet-Beta** - Production network with real SOL and USDC
- **Localnet** - Local development with `solana-test-validator`

## 🎨 Design System

### Color Palette
- **Primary** - Blue (#3b82f6) for main actions
- **Secondary** - Gray (#64748b) for text and borders
- **Success** - Green (#22c55e) for positive states
- **Warning** - Yellow (#f59e0b) for cautions
- **Error** - Red (#ef4444) for errors

### Typography
- **Inter** - Clean, modern sans-serif font
- **JetBrains Mono** - Monospace for addresses and code

### Components

#### Layout System
- **Responsive sidebar** - Collapsible on mobile, fixed on desktop
- **Top navigation** - Breadcrumb navigation and wallet status
- **Main content area** - Scrollable page content

#### Interactive Elements
- **Buttons** - Primary, secondary, outline, and danger variants
- **Forms** - Consistent input styling with validation states
- **Cards** - Tournament cards with hover effects
- **Modals** - Overlay dialogs for actions
- **Toasts** - Non-intrusive notifications

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile Optimizations
- **Touch-friendly buttons** - Minimum 44px tap targets
- **Swipe gestures** - Horizontal scrolling for cards
- **Optimized forms** - Proper input types on mobile
- **Collapsible navigation** - Hamburger menu on small screens

## 🔐 Security

### Wallet Security
- **Connection validation** - Proper wallet signature verification
- **Transaction simulation** - Pre-flight transaction checks
- **Error handling** - Comprehensive error boundaries
- **Secure storage** - No sensitive data in localStorage

### Smart Contract Security
- **Read-only operations** - Public data access without wallet connection
- **Authorization checks** - Verify admin permissions for sensitive actions
- **Input validation** - Client and server-side validation
- **PDA security** - Proper Program Derived Address handling

## 🚀 Deployment

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Production

#### Vercel (Recommended)
```bash
npm run build
npx vercel --prod
```

#### Netlify
```bash
npm run build
npx netlify deploy --dir=dist --prod
```

#### Docker
```bash
# Build the image
docker build -t espotz-frontend .

# Run the container
docker run -p 3000:3000 espotz-frontend
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Linting
```bash
npm run lint
```

## 📊 Performance

### Optimization Techniques
- **Code splitting** - Lazy load pages and components
- **Tree shaking** - Remove unused code in production
- **Image optimization** - WebP format with fallbacks
- **Caching strategy** - Service worker for static assets
- **Bundle analysis** - Regular bundle size monitoring

### Performance Metrics
- **First Contentful Paint** < 1.5s
- **Largest Contentful Paint** < 2.5s
- **Cumulative Layout Shift** < 0.1
- **Bundle size** < 500KB (gzipped)

## 🔧 Development Workflow

### Git Workflow
1. **Feature branches** - `feature/tournament-creation`
2. **Pull requests** - Code review required
3. **Main branch** - `main` for production
4. **Release tags** - `v1.0.0`, `v1.1.0`, etc.

### Code Quality
- **ESLint** - Consistent code style
- **Prettier** - Automatic code formatting
- **TypeScript** - Strict type checking
- **Husky** - Pre-commit hooks

## 📚 Documentation

### Component Documentation
- **Storybook** - Interactive component documentation
- **JSDoc** - Function and component documentation
- **Type definitions** - Comprehensive TypeScript types

### API Documentation
- **Smart contract integration** - Anchor client usage examples
- **Wallet adapter** - Connection and transaction examples
- **State management** - Zustand store patterns

## 🐛 Troubleshooting

### Common Issues

#### Wallet Connection Problems
```bash
# Clear wallet cache
localStorage.removeItem('walletAdapter')

# Refresh page
window.location.reload()

# Check wallet compatibility
# Ensure using supported wallet version
```

#### Build Issues
```bash
# Clear node modules
rm -rf node_modules package-lock.json

# Clear Vite cache
rm -rf .vite dist

# Reinstall dependencies
npm install
```

#### Development Server Issues
```bash
# Check port usage
lsof -i :5173

# Kill existing process
kill -9 $(lsof -ti:5173)

# Start with specific port
npm run dev -- --port 3001
```

## 🔄 Updates & Maintenance

### Dependency Updates
```bash
# Check for outdated packages
npm outdated

# Update specific package
npm update package-name

# Update all packages
npm update
```

### Security Updates
- Regular dependency audits
- Smart contract address updates
- Network security patches
- Wallet adapter updates

## 🤝 Contributing

### Getting Started
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- Follow existing patterns and conventions
- Use TypeScript for all new code
- Add JSDoc comments for public APIs
- Keep components small and focused

### Pull Request Process
- Describe changes clearly
- Link to related issues
- Include screenshots for UI changes
- Ensure all tests pass

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

### Documentation
- [Component Documentation](./docs/components/)
- [API Reference](./docs/api/)
- [Development Guide](./docs/development/)

### Community
- [Discord](https://discord.gg/espotz)
- [GitHub Issues](https://github.com/espotz/issues)
- [Twitter](https://twitter.com/espotz)

---

Built with ❤️ for the Solana gaming community