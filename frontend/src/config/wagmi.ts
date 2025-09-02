import { http, createConfig } from 'wagmi'
import { mainnet, sepolia, polygon } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Define iExec Bellecour testnet
const bellecour = {
  id: 134,
  name: 'iExec Bellecour',
  nativeCurrency: {
    decimals: 18,
    name: 'xRLC',
    symbol: 'xRLC',
  },
  rpcUrls: {
    default: {
      http: ['https://bellecour.iex.ec'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Bellecour Explorer',
      url: 'https://blockscout-bellecour.iex.ec',
    },
  },
  testnet: true,
} as const

export const config = createConfig({
  chains: [bellecour, mainnet, sepolia, polygon],
  connectors: [injected()],
  transports: {
    [bellecour.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
  },
  ssr: true,
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}