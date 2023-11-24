import { l1StandardBridgeABI } from '@eth-optimism/contracts-ts'
import { type Config } from '@wagmi/core'
import { type WriteDepositERC20Parameters as WriteDepositERC20ActionParameters } from 'op-viem/actions'
import { useAccount, useWriteContract } from 'wagmi'
import type { OpConfig } from '../../types/OpConfig.js'
import type { UseWriteOPActionBaseParameters } from '../../types/UseWriteOPActionBaseParameters.js'
import type { UseWriteOPActionBaseReturnType } from '../../types/UseWriteOPActionBaseReturnType.js'
import type { WriteOPContractBaseParameters } from '../../types/WriteOPContractBaseParameters.js'
import { useOpConfig } from '../useOpConfig.js'

const ABI = l1StandardBridgeABI
const FUNCTION = 'depositERC20To'

export type WriteDepositERC20Parameters<
  config extends Config = OpConfig,
  chainId extends config['chains'][number]['id'] = number,
> =
  & WriteOPContractBaseParameters<typeof ABI, typeof FUNCTION, config, chainId>
  // The L1CrossDomainMessenger will add the L2 gas we need, so we can pass 0 to the contract by default & make the argument optional
  & { args: Omit<Pick<WriteDepositERC20ActionParameters, 'args'>['args'], 'minGasLimit'> & { minGasLimit?: number } }
  & { l2ChainId: number }

export type UseWriteDepositERC20Parameters<config extends Config = OpConfig, context = unknown> =
  UseWriteOPActionBaseParameters<config, context>

export type UseWriteDepositERC20ReturnType<config extends Config = OpConfig, context = unknown> =
  & Omit<UseWriteOPActionBaseReturnType<WriteDepositERC20Parameters, config, context>, 'write' | 'writeAsync'>
  & {
    writeDepositERC20: UseWriteOPActionBaseReturnType<WriteDepositERC20Parameters, config, context>['write']
    writeDepositERC20Async: UseWriteOPActionBaseReturnType<
      WriteDepositERC20Parameters,
      config,
      context
    >['writeAsync']
  }

/**
 * Deposits ERC20 tokens to L2 using the standard bridge
 * @param parameters - {@link UseWriteDepositERC20Parameters}
 * @returns wagmi [useWriteContract return type](https://alpha.wagmi.sh/react/api/hooks/useWrtieContract#return-type). {@link UseWriteDepositERC20ReturnType}
 */
export function useWriteDepositERC20<config extends Config = OpConfig, context = unknown>(
  args: UseWriteDepositERC20Parameters<config, context> = {},
): UseWriteDepositERC20ReturnType<config, context> {
  const config = useOpConfig(args)
  const { writeContract, writeContractAsync, ...writeReturn } = useWriteContract()
  const account = useAccount(args)

  return {
    writeDepositERC20: ({ l2ChainId, args, ...rest }: WriteDepositERC20Parameters) => {
      const l2Chain = config.l2chains[l2ChainId]

      if (!l2Chain) {
        throw new Error('L2 chain not configured')
      }

      return writeContract({
        chainId: l2Chain.l1ChainId,
        address: l2Chain.l1Addresses.l1StandardBridge.address,
        abi: ABI,
        functionName: FUNCTION,
        args: [args.l1Token, args.l2Token, args.to, args.amount, args.minGasLimit ?? 0, args.extraData ?? '0x'],
        account: account.address,
        ...rest,
      })
    },
    writeDepositERC20Async: ({ l2ChainId, args, ...rest }: WriteDepositERC20Parameters) => {
      const l2Chain = config.l2chains[l2ChainId]

      if (!l2Chain) {
        throw new Error('L2 chain not configured')
      }

      return writeContractAsync({
        chainId: l2Chain.l1ChainId,
        address: l2Chain.l1Addresses.l1StandardBridge.address,
        abi: ABI,
        functionName: FUNCTION,
        args: [args.l1Token, args.l2Token, args.to, args.amount, args.minGasLimit ?? 0, args.extraData ?? '0x'],
        account: account.address,
        ...rest,
      })
    },
    ...writeReturn,
  } as unknown as UseWriteDepositERC20ReturnType<config, context>
}
