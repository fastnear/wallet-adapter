/**
 * @typedef {Object} WalletState
 * @property {string} [accountId] - NEAR account ID if signed in
 * @property {string} [publicKey] - Public key if available
 * @property {string} [privateKey] - Private key if available
 * @property {string} [lastWalletId] - ID of last used wallet
 */

/**
 * @typedef {Object} WalletAction
 * @property {string} type - Action type
 * @property {Object} [args] - Action arguments
 * @property {string|number} [gas] - Gas to attach
 * @property {string|number} [deposit] - Deposit to attach
 */

/**
 * @typedef {Object} SignInConfig
 * @property {string} networkId - NEAR network ID ('mainnet' or 'testnet')
 * @property {string} contractId - Contract ID to request access for
 * @property {'near'|'here'|'meteor'} [wallet] - Preferred wallet to use
 */

/**
 * @typedef {Object} SignInResult
 * @property {string} [url] - URL to redirect to if needed
 * @property {string} [accountId] - Account ID if immediately available
 * @property {string} [error] - Error message if sign in failed
 */

/**
 * @typedef {Object} TransactionConfig
 * @property {string} receiverId - Transaction receiver account ID
 * @property {WalletAction[]} actions - Transaction actions to perform
 * @property {'near'|'here'|'meteor'} [wallet] - Preferred wallet to use
 */

/**
 * @typedef {Object} TransactionResult
 * @property {string} [url] - URL to redirect to if needed
 * @property {string} [hash] - Transaction hash if immediately available
 * @property {string} [error] - Error message if transaction failed
 */

/**
 * @typedef {Object} WalletAdapterConfig
 * @property {string} [widgetUrl] - URL of the wallet widget (defaults to official hosted version)
 * @property {string} [targetOrigin] - Target origin for postMessage (defaults to '*')
 * @property {(state: WalletState) => void} [onStateUpdate] - Called when wallet state changes
 */

/**
 * Interface for interacting with NEAR wallets
 */
export class WalletAdapter {
    /** @type {HTMLIFrameElement} */
    #iframe = null;

    /** @type {string} */
    #targetOrigin;

    /** @type {string} */
    #widgetUrl;

    /** @type {Map<string, Function>} */
    #pending = new Map();

    /** @type {WalletState} */
    #state = {};

    /** @type {Function} */
    #onStateUpdate;

    /** @type {string} */
    static defaultWidgetUrl = 'https://wallet-adapter.fastnear.com';

    /**
     * @param {WalletAdapterConfig} [config]
     */
    constructor({
      widgetUrl = WalletAdapter.defaultWidgetUrl,
      targetOrigin = '*',
      onStateUpdate
    } = {}) {
      this.#targetOrigin = targetOrigin;
      this.#widgetUrl = widgetUrl;
      this.#onStateUpdate = onStateUpdate;
      window.addEventListener('message', this.#handleMessage.bind(this));
    }

    /**
     * Creates an iframe for wallet interaction
     * @param {string} path - Path to load in iframe
     * @returns {HTMLIFrameElement}
     */
    #createIframe(path) {
      // Remove existing iframe if any
      if (this.#iframe) {
        this.#iframe.remove();
      }

      // Create URL
      const url = new URL(path, this.#widgetUrl);

      // Create and configure iframe
      const iframe = document.createElement('iframe');
      iframe.src = url.toString();
      iframe.allow = 'usb';
      iframe.style.border = 'none';
      iframe.style.zIndex = '10000';
      iframe.style.position = 'fixed';
      iframe.style.display = 'block';
      iframe.style.top = '0';
      iframe.style.left = '0';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      document.body.appendChild(iframe);

      this.#iframe = iframe;
      return iframe;
    }

    /**
     * Handles messages from the wallet widget
     * @param {MessageEvent} event
     */
    #handleMessage(event) {
      // Check origin if specified
      if (this.#targetOrigin !== '*' && event.origin !== this.#targetOrigin) {
        return;
      }

      const { id, type, action, payload } = event.data;
      if (type !== 'wallet-adapter') return;

      // Handle close action
      if (action === 'close') {
        this.#iframe?.remove();
        this.#iframe = null;
        return;
      }

      // Update state if provided
      if (payload?.state) {
        this.#state = { ...this.#state, ...payload.state };
        this.#onStateUpdate?.(this.#state);
      }

      // Resolve pending promise if any
      const resolve = this.#pending.get(id);
      if (resolve) {
        this.#pending.delete(id);
        this.#iframe?.remove();
        this.#iframe = null;
        resolve(payload);
      }
    }

    /**
     * Sends a message to the wallet widget
     * @param {string} path - Path to load in iframe
     * @param {string} method - Method to call
     * @param {Object} params - Parameters to pass
     * @returns {Promise<any>}
     */
    async #sendMessage(path, method, params) {
      return new Promise((resolve) => {
        const id = Math.random().toString(36).slice(2);
        this.#pending.set(id, resolve);

        const iframe = this.#createIframe(path);

        iframe.onload = () => {
          iframe.contentWindow?.postMessage({
            type: 'wallet-adapter',
            method,
            params: {
              id,
              ...params,
              state: this.#state
            }
          }, this.#targetOrigin);
        };
      });
    }

    /**
     * Get current wallet state
     * @returns {WalletState}
     */
    getState() {
      return { ...this.#state };
    }

    /**
     * Sign in with a NEAR wallet
     * @param {SignInConfig} config
     * @returns {Promise<SignInResult>}
     */
    async signIn(config) {
      return this.#sendMessage('/login.html', 'signIn', config);
    }

    /**
     * Send a transaction using connected wallet
     * @param {TransactionConfig} config
     * @returns {Promise<TransactionResult>}
     */
    async sendTransaction(config) {
      return this.#sendMessage('/sign.html', 'sendTransaction', config);
    }

    /**
     * Clean up adapter resources
     */
    destroy() {
      window.removeEventListener('message', this.#handleMessage);
      this.#iframe?.remove();
      this.#iframe = null;
    }
  }
