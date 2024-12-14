# @fastnear/wallet-adapter

A lightweight, dependency-free client interface for integrating NEAR wallets into your dApp.

## Features

- 🚀 Zero dependencies
- 📱 Works with all major NEAR wallets
- 💪 Full TypeScript support
- 🔒 Secure iframe-based design
- 📦 ESM and CommonJS support
- 🎯 Simple, promise-based API

## Installation

```bash
npm install @fastnear/wallet-adapter
```

## Basic Usage

```javascript
import { WalletAdapter } from '@fastnear/wallet-adapter';

// Create adapter instance
const adapter = new WalletAdapter();

// Sign in
const result = await adapter.signIn({
  networkId: 'mainnet',
  contractId: 'example.near',
  wallet: 'near' // optional, defaults to user choice
});

if (result.url) {
  // Redirect to wallet
  window.location.href = result.url;
} else if (result.accountId) {
  console.log('Signed in as:', result.accountId);
} else if (result.error) {
  console.error('Failed to sign in:', result.error);
}

// Send transaction
const txResult = await adapter.sendTransaction({
  receiverId: 'example.near',
  actions: [{
    type: 'FunctionCall',
    params: {
      methodName: 'example_method',
      args: { /* ... */ },
      gas: '30000000000000',
      deposit: '0'
    }
  }]
});

if (txResult.url) {
  window.location.href = txResult.url;
} else if (txResult.hash) {
  console.log('Transaction hash:', txResult.hash);
}

// Clean up when done
adapter.destroy();
```

## Advanced Configuration

```javascript
const adapter = new WalletAdapter({
  // Custom widget URL (defaults to official hosted version)
  widgetUrl: 'https://your-domain.com/wallet-widget/',
  
  // Restrict message origin for security (defaults to '*')
  targetOrigin: 'https://your-domain.com',
  
  // Handle wallet state updates
  onStateUpdate: (state) => {
    localStorage.setItem('wallet-state', JSON.stringify(state));
  }
});
```

## API Reference

### `new WalletAdapter(config?)`

Creates a new wallet adapter instance.

#### Config Options
- `widgetUrl?: string` - URL of the wallet widget (defaults to official hosted version)
- `targetOrigin?: string` - Target origin for postMessage (defaults to '*')
- `onStateUpdate?: (state: WalletState) => void` - Called when wallet state changes

### `signIn(config)`

Signs in with a NEAR wallet.

#### Config
```typescript
{
  networkId: 'mainnet' | 'testnet',
  contractId: string,
  wallet?: 'near' | 'here' | 'meteor'
}
```

#### Returns
```typescript
Promise<{
  url?: string,        // URL to redirect to if needed
  accountId?: string,  // Account ID if immediately available
  error?: string       // Error message if sign in failed
}>
```

### `sendTransaction(config)`

Sends a transaction using the connected wallet.

#### Config
```typescript
{
  receiverId: string,
  actions: Array<{
    type: string,
    params: {
      methodName?: string,
      args?: Object,
      gas?: string,
      deposit?: string
    }
  }>,
  wallet?: 'near' | 'here' | 'meteor'
}
```

#### Returns
```typescript
Promise<{
  url?: string,    // URL to redirect to if needed
  hash?: string,   // Transaction hash if immediately available
  error?: string   // Error message if transaction failed
}>
```

### `getState()`

Gets current wallet state.

#### Returns
```typescript
{
  accountId?: string,    // NEAR account ID if signed in
  publicKey?: string,    // Public key if available
  privateKey?: string,   // Private key if available
  lastWalletId?: string  // ID of last used wallet
}
```

### `destroy()`

Cleans up adapter resources. Should be called when adapter is no longer needed.

## Supported Wallets

- NEAR Wallet (MyNearWallet)
- HERE Wallet
- Meteor Wallet

## License

MIT
