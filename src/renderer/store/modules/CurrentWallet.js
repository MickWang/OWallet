import axios from 'axios'
import {
    getBalanceUrl,
    getRestClient,
    formatOngValue
} from '../../../core/utils'
 
import { NET_TYPE } from '../../../core/consts';
import { Crypto } from 'ontology-ts-sdk';
import BigNumber from 'bignumber.js';

const state = {
    wallet : {
        // for json and hardware wallet
        publicKey: '',
        address: '',
        name: '',
        //for shared wallet
        coPayers: [],
        requiredNumber:'',
        totalNumber:''
    },
    balance: {
        ont: 0,
        ong: 0,
        waitBoundOng:0,
        unboundOng: 0
    },
    transfer: {
        balance : {
            ont: 0,
            ong: 0
        },
        oep4s:[],
        from:'',
        to: '',
        amount:0,
        asset:'ONT',
        gas:0.01,
        coPayers : [],
        sponsorPayer:'',
        isRedeem: false
    },
    pendingTx: {
        
    },
    currentSigner: '',
    localCopayers : [],
    redeem: {
        claimableOng: 0,
        balanceOng: 0
    },
    nep5Ont: 0
}

const mutations = {
    UPDATE_CURRENT_WALLET(state, payload){
        state.wallet = Object.assign({}, state.wallet, payload.wallet);
    },
    UPDATE_TRANSFER(state, payload) {
        state.transfer = Object.assign({}, state.transfer, payload.transfer)
    }, 
    UPDATE_LOCAL_COPAYERS(state, payload) {
        state.localCopayers = payload.localCopayers
    },
    UPDATE_PENDINGTX(state, payload) {
        state.pendingTx = payload.pendingTx
    },
    UPDATE_CURRENT_SIGNER(state, payload) {
        state.currentSigner = payload.account
    },
    UPDATE_NATIVE_BALANCE(state, payload) {
        state.balance = payload.balance
    },
    CLEAR_NATIVE_BALANCE(state, payload) {
        state.balance = {}
    },
    CLEAR_CURRENT_TRANSFER(state, payload) {
        state.transfer = {
            balance: {
                ont: 0,
                ong: 0
            },
            oep4s: [],
            from: '',
            to: '',
            amount: 0,
            asset: 'ONT',
            gas: 0.01,
            coPayers: [],
            sponsorPayer: ''
        }
    },
    UPDATE_CURRENT_REDEEM(state, payload) {
        state.redeem = payload.redeem
    },
    UPDATE_NEP5_ONT(state, payload) {
        state.nep5Ont = payload.nep5Ont
    },
    UPDATE_TRANSFER_REDEEM_TYPE(state, payload) {
        state.transfer.isRedeem = payload.type;
        state.transfer.asset = payload.type ? 'ONG' : 'ONT'
    }

}

const actions = {
    clearTransferBalance({commit}) {
        commit('CLEAR_CURRENT_TRANSFER')
    },
    async getNativeBalance({ commit }, { address }) {
        const balance = {}
        if (localStorage.getItem('net') === NET_TYPE.PRIVATE_NET) {
            const restClient = getRestClient();
            const res1 = await restClient.getBalance(new Crypto.Address(address))
                console.log(res1)
                balance.ont = res1.Result.ont
            balance.ong = formatOngValue(res1.Result.ong)
            
            const res2 = await restClient.getUnboundOng(new Crypto.Address(address))
                balance.unboundOng = formatOngValue(res2.Result)

            const res3 = await restClient.getGrangOng(new Crypto.Address(address))
                balance.waitBoundOng = formatOngValue(res3.Result)
            commit('UPDATE_NATIVE_BALANCE', {
                balance
            })
            return balance; // get balance succeed
        } else {
            const url = getBalanceUrl(address, 'NATIVE');
            return axios.get(url).then(res => {
                if (res.data.result) {
                    for (let r of res.data.result) {
                        if (r.asset_name === 'ong') {
                            balance.ong = r.balance;
                        }
                        if (r.asset_name === 'waitboundong') {
                            balance.waitBoundOng = r.balance;
                        }
                        if (r.asset_name === 'unboundong') {
                            balance.unboundOng = r.balance;
                        }
                        if (r.asset_name === 'ont') {
                            balance.ont = r.balance;
                        }
                    }
                    commit('UPDATE_NATIVE_BALANCE', {
                        balance
                    })
                    return balance; // get balance succeed
                }
            }).catch(err => {
                console.log(err)
                return null; // get balance failed
            })
        }
        
    }
}

export default {
    state,
    mutations,
    actions
}
