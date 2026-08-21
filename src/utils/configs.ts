import { initChainInformationConfig } from '@bgd-labs/frontend-web3-utils';

import { CHAINS } from './chains';

// ipfs gateway to get proposals metadata
// proposals are first uploaded to app-ipfs.aave.com / filebase,
// so they are tried before public gateways
export const ipfsGateway = 'https://app-ipfs.aave.com/ipfs';
export const fallbackGateways = [
  'https://ipfs.filebase.io/ipfs',
  'https://dweb.link/ipfs',
  'https://ipfs.eth.aragon.network/ipfs',
  'https://ipfs.runfission.com/ipfs',
];

export const chainInfoHelper = initChainInformationConfig(CHAINS);
