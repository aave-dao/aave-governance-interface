import { InitialPayload, Payload } from '../governance-ui-helpers';
import { StoreSlice } from '@bgd-labs/frontend-web3-utils';
import { produce } from 'immer';

import { generateSeatbeltLink } from '../proposals/utils/formatPayloadData';
import {
  cachedProposalsPayloadsPath,
  githubStartUrl,
} from '../utils/cacheGithubLinks';

type PayloadHelperDataItem = {
  seatbeltMD?: string;
  proposalId?: number;
};
export interface IPayloadsHelperSlice {
  cachedProposalsPayloadsData: Record<number, InitialPayload[]>;
  getCachedProposalPayloadsData: () => Promise<
    Record<number, InitialPayload[]> | undefined
  >;

  payloadsHelperData: Record<string, PayloadHelperDataItem>;
  setPayloadsHelperData: ({
    chainId,
    payloadsController,
    payloadId,
    seatbeltMD,
    proposalId,
  }: PayloadHelperDataItem & {
    chainId: number;
    payloadsController: string;
    payloadId: number;
  }) => void;

  getPayloadSeatbeltMD: (payload: Payload) => Promise<string | undefined>;
  getPayloadProposalId: (
    payload: Payload,
    withoutRequest?: boolean,
  ) => Promise<number | undefined>;
}

export const createPayloadsHelperSlice: StoreSlice<IPayloadsHelperSlice> = (
  set,
  get,
) => ({
  cachedProposalsPayloadsData: {},
  getCachedProposalPayloadsData: async () => {
    if (!Object.keys(get().cachedProposalsPayloadsData).length) {
      const proposalsPayloadsResponse = await fetch(
        `${githubStartUrl}/${cachedProposalsPayloadsPath}`,
      );
      if (proposalsPayloadsResponse.ok) {
        const proposalsPayloads = (await proposalsPayloadsResponse.json()) as {
          data: Record<number, InitialPayload[]>;
        };
        set((state) =>
          produce(state, (draft) => {
            draft.cachedProposalsPayloadsData = proposalsPayloads.data;
          }),
        );
        return proposalsPayloads.data;
      }
    }
  },

  payloadsHelperData: {},
  setPayloadsHelperData: ({
    chainId,
    payloadsController,
    payloadId,
    seatbeltMD,
    proposalId,
  }) => {
    const key = `${chainId}_${payloadsController}_${payloadId}`;
    set((state) =>
      produce(state, (draft) => {
        if (seatbeltMD) {
          draft.payloadsHelperData[key] = {
            ...draft.payloadsHelperData[key],
            seatbeltMD,
          };
        }
        if (!!proposalId || proposalId === 0) {
          draft.payloadsHelperData[key] = {
            ...draft.payloadsHelperData[key],
            proposalId,
          };
        }
      }),
    );
  },

  getPayloadSeatbeltMD: async (payload) => {
    const payloadHelperData =
      get().payloadsHelperData[
        `${payload.chainId}_${payload.payloadsController}_${payload.id}`
      ];

    if (payloadHelperData && !!payloadHelperData.seatbeltMD) {
      return payloadHelperData.seatbeltMD;
    } else {
      const preLink =
        'https://raw.githubusercontent.com/aave-dao/seatbelt-gov-v3/main/reports/payloads/';

      try {
        const response = await fetch(generateSeatbeltLink(payload, preLink));

        if (response.ok) {
          const reportMD: string = await response.text();
          get().setPayloadsHelperData({
            chainId: payload.chainId,
            payloadsController: payload.payloadsController,
            payloadId: payload.id,
            seatbeltMD: reportMD,
          });
          return reportMD;
        } else {
          return undefined;
        }
      } catch {
        return undefined;
      }
    }
  },

  getPayloadProposalId: async (payload, withoutRequest) => {
    const payloadHelperData =
      get().payloadsHelperData[
        `${payload.chainId}_${payload.payloadsController}_${payload.id}`
      ];

    if (
      payloadHelperData &&
      (!!payloadHelperData.proposalId || payloadHelperData.proposalId === 0)
    ) {
      return payloadHelperData.proposalId;
    } else {
      const proposalsPayloadsData = get().cachedProposalsPayloadsData;
      if (Object.keys(proposalsPayloadsData).length) {
        const proposalIdConnectedToPayload = Object.entries(
          proposalsPayloadsData,
        ).find((data) =>
          data[1].find(
            (proposalPayload) =>
              proposalPayload.id === payload.id &&
              proposalPayload.chainId === payload.chainId,
          ),
        );
        const proposalIdConnectedToPayloadFinal =
          proposalIdConnectedToPayload?.length
            ? Number(proposalIdConnectedToPayload[0])
            : undefined;
        get().setPayloadsHelperData({
          chainId: payload.chainId,
          payloadsController: payload.payloadsController,
          payloadId: payload.id,
          proposalId: proposalIdConnectedToPayloadFinal,
        });
        return proposalIdConnectedToPayloadFinal;
      } else if (!withoutRequest) {
        const proposalsPayloadsData =
          await get().getCachedProposalPayloadsData();
        if (
          !!Object.keys(proposalsPayloadsData || {}).length &&
          proposalsPayloadsData
        ) {
          const proposalIdConnectedToPayload = Object.entries(
            proposalsPayloadsData,
          ).find((data) =>
            data[1].find(
              (proposalPayload) =>
                proposalPayload.id === payload.id &&
                proposalPayload.chainId === payload.chainId,
            ),
          );
          const proposalIdConnectedToPayloadFinal =
            proposalIdConnectedToPayload?.length
              ? Number(proposalIdConnectedToPayload[0])
              : undefined;
          get().setPayloadsHelperData({
            chainId: payload.chainId,
            payloadsController: payload.payloadsController,
            payloadId: payload.id,
            proposalId: proposalIdConnectedToPayloadFinal,
          });
          return proposalIdConnectedToPayloadFinal;
        }
      }
    }
  },
});
