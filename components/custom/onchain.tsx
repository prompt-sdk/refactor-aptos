'use client';

import { Account } from '@aptos-labs/ts-sdk';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

import { getAptosClient } from '@/components/utils/utils';

import ProfileBtnFrame from '@public/public/assets/svgs/profile-btn-frame.svg';
import React from 'react';

export const SmartAction = ({ props: data }: { props: any }) => {
    const { account } = useWallet();

    const onTransfer = async () => {
        const aptosClient = getAptosClient();

        try {
            const txn = await aptosClient.transaction.build.simple({
                sender: account?.address.toString() as any,
                data: data
            });

            console.log(txn);
            console.log('\n=== Transfer transaction ===\n');
            const committedTxn = await aptosClient.signAndSubmitTransaction({
                signer: account as unknown as Account,
                transaction: txn
            });

            await aptosClient.waitForTransaction({ transactionHash: committedTxn.hash });
            console.log(`Committed transaction: ${committedTxn.hash}`);
        } catch (err) {
            console.error('Error', err);
        }
    };

    return (
        <>
            <div className="flex flex-col gap-3 px-4 py-3 text-white">
                <span>Function : {data.function}</span>
                <p>
                    {JSON.stringify(
                        data,
                        (key, value) => (typeof value === 'bigint' ? value.toString() : value) // return everything else unchanged
                    )}
                </p>

                <div
                    style={{ borderImageSource: `url("${ProfileBtnFrame.src}")` }}
                    className="flex w-full cursor-pointer items-center justify-center gap-1 px-11 py-1 uppercase [border-image-slice:13_fill] [border-image-width:15px] md:w-auto "
                    onClick={onTransfer}
                >
                    <i className="ico-send-right-icon" /> Excute
                </div>
            </div>
        </>
    );
};
