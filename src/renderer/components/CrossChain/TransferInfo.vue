<style scoped>
.label {
    font-weight: bold;
    position: relative;
    font-family: "AvenirNext-Bold";
    color: #5e6369;
    font-size: 1.25rem;
    margin: 0;
    margin-bottom:25px;
}
.select-asset {
    width: 100%;
    margin-top: 8px;
    margin-bottom: 24px;
    /* margin-left: 4rem; */
}
.input-amount {
    margin-bottom: 24px;
    /* padding-left: 4rem; */
}

.fee-label {
    height: 36px;
    line-height: 36px;
    margin: 0;
}
.fee-select {
    margin-bottom: 50px;
    /* padding-left: 4rem; */
}
.recipient-input {
    /* padding-left: 4rem; */
}
.error-to {
    border-color: red !important;
}
.error-amount :first-child {
    border-color: red !important;
}
.transfer-container {
    display: flex;
    justify-content: center;
    margin-top: 50px;
}
.left-part {
    width: 400px;
    margin-right: 80px;
}
.right-part {
    width: 400px;
}

.form-label {
    margin:0;
    font-size: 14px;
    font-family: AvenirNext-Medium, AvenirNext;
    font-weight: 500;
    color: rgba(0, 0, 0, 1);
}
</style>
<template>
    <div class="transfer-container">
        <div class="left-part">
            <p class="label">{{$t('sharedWalletHome.send')}}</p>
            <p class="form-label">Asset From Ontology</p>
            <a-select
                v-model="scriptHash"
                @change="changeAsset"
                class="select-asset"
                :options="assetOptions"
            ></a-select>
            <a-input-search
                :placeholder="$t('sharedWalletHome.amount')"
                class="input-amount"
                @change="validateAmount"
                :class="validAmount? '': 'error-amount'"
                @search="maxAmount"
                :enterButton="$t('sharedWalletHome.max')"
                v-model="amount"
                type="number"
            />

            <a-row class="fee-select">
                <a-col :span="2">
                    <label class="fee-label font-medium">Fee:</label>
                </a-col>
                <a-col :span="14">
                    <a-slider :min="0.01" :max="0.1" v-model="gas" :step="0.002" />
                </a-col>
                <a-col :span="8">
                    <a-input-number
                        :min="0"
                        :max="0.1"
                        :step="0.002"
                        v-model="gas"
                        style="width:70px;margin-right:10px;margin-left:10px;"
                    />
                    <label class="font-medium">ONG</label>
                </a-col>
            </a-row>
        </div>

        <div class="right-part">
            <p class="label">{{$t('sharedWalletHome.to')}}</p>
            <p class="form-label">Blockchain</p>
            <a-select v-model="to_chainId" class="select-asset">
                <a-select-option :value="3">NEO</a-select-option>
            </a-select>
            <div class="recipient-input">
                <a-input
                    v-model="to"
                    :disabled="true"
                    class="input"
                    :class="validToAddress? '': 'error-to' "
                    :placeholder="$t('sharedWalletHome.recipient')"
                    @change="validateToAddress"
                ></a-input>
            </div>

            <div class="footer-btns">
                <div class="footer-btn-container">
                    <a-button
                        type="default"
                        class="btn-cancel"
                        @click="cancel"
                    >{{$t('sharedWalletHome.cancel')}}</a-button>
                    <a-button
                        type="primary"
                        class="btn-next"
                        @click="next"
                    >{{$t('sharedWalletHome.next')}}</a-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import {
    varifyPositiveInt,
    varifyOngValue,
    validateAddress
} from "../../../core/utils.js";
import { mapState } from "vuex";
import { BigNumber } from "bignumber.js";

export default {
    name: "SendAsset",
    data() {
        const net = localStorage.getItem("net");
        // const currentWallet = JSON.parse(sessionStorage.getItem('currentWallet'));
        return {
            // address: currentWallet.address,
            gas: 0,
            asset: "ONT",
            scriptHash: "",
            decimal: 1,
            amount: 0,
            to: "",
            validToAddress: true,
            validAmount: true,
            net,
            selectedOep4: {},
            to_chainId: 3,
            assetOptions: [],
            tokens: [
                {
                    contract_hash: "bce91f027a8c6a3888f43dc4dc041ae6f6c2b186",
                    decimal: 8,
                    symbol: "NEOX"
                }
            ]
        };
    },
    computed: {
        ...mapState({
            balance: state => state.CurrentWallet.balance,
            address: state => state.CurrentWallet.wallet.address,
            oep4s: state => state.Tokens.oep4WithBalances
        })
        // oep4s() {
        //     return this.$store.state.Oep4s.oep4s.filter(item => item.net === this.net)
        // }
    },
    watch: {
        address: function(newVal, oldVal) {
            console.log(newVal)
            this.to = newVal;
        }
    },
    mounted() {
        // this.$store.dispatch('queryBalanceForOep4', this.address)
        const transfer = this.$store.state.CurrentWallet.transfer;
        this.gas = 0;
        this.asset = '';
        this.amount = transfer.amount;
        this.to = this.address;

        this.getAssetOptions();
    },

    methods: {
        async getAssetOptions() {
            // return Promise.all(contractHashes.map(hash => this.$store.dispatch('queryOep4Balance',
            // {scriptHash: hash, address: this.address, decimal:8}))).then(res => {
            //     return res.map((item,index) => ({
            //         label: this.fatchTokenLabel(index),
            //         value: item
            //     }))
            // })
            const balance = await this.$store.dispatch("queryOep4Balance", {
                scriptHash: this.tokens[0].contract_hash,
                address: this.address,
                decimal: 8
            });
            const symbol = await this.$store.dispatch('queryOep4Symbol', this.tokens[0].contract_hash)
            console.log('symbol ',symbol)
            this.tokens[0].symbol = symbol;
            this.assetOptions = [
                {
                    label: `${symbol}(${balance} in total)`,
                    value: this.tokens[0].contract_hash
                    // TODO decimal
                }
            ];
            this.tokens[0].balance = balance;
        },
        validateToAddress() {
            // if (!this.to || !validateAddress(this.to)) {
            //     this.validToAddress = false;
            //     return;
            // }
            this.validToAddress = true;
        },
        validateAmount() {
            if (this.asset === "ONT" && !varifyPositiveInt(this.amount)) {
                this.validAmount = false;
                return;
            } else if (!varifyOngValue(this.amount)) {
                this.validAmount = false;
                return;
            }
            if (
                (this.asset === "ONT" &&
                    Number(this.amount) > Number(this.balance.ont)) ||
                (this.asset === "ONG" &&
                    Number(this.amount) > Number(this.balance.ong)) ||
                Number(this.amount) > Number(this.selectedOep4.balance)
            ) {
                this.validAmount = false;
                this.$message.error(this.$t("transfer.exceedBalance"));
                return;
            }

            if (
                this.asset === "ONG" &&
                new BigNumber(this.amount)
                    .plus(this.gas)
                    .isGreaterThan(this.balance.ong)
            ) {
                this.$message.error(this.$t("transfer.exceedBalance"));
                this.validAmount = false;
                return;
            }
            this.validAmount = true;
        },
        changeAsset(value) {
            this.amount = "0";
            // if (value !== "ONT" && value !== "ONG") {
            //     for (let i = 0; i < this.oep4s.length; i++) {
            //         if (this.oep4s[i].contract_hash === value) {
            //             this.scriptHash = this.oep4s[i].contract_hash;
            //             this.decimal = this.oep4s[i].decimal;
            //             this.selectedOep4 = this.oep4s[i];
            //             this.asset = this.oep4s[i].symbol;
            //             break;
            //         }
            //     }
            // } else {
            //     this.asset = value;
            // }

            for (let i = 0; i < this.tokens.length; i++) {
                if (this.tokens[i].contract_hash === value) {
                    this.scriptHash = this.tokens[i].contract_hash;
                    this.decimal = this.tokens[i].decimal;
                    this.selectedOep4 = this.tokens[i];
                    this.asset = this.tokens[i].symbol;
                    break;
                }
            }

            console.log(value);
        },
        maxAmount() {
            if (this.asset === "ONT") {
                this.amount = this.balance.ont;
            } else if (this.asset === "ONG") {
                this.amount = new BigNumber(this.balance.ong)
                    .minus(this.gas)
                    .toString();
                this.validateAmount();
            } else {
                for (let i = 0; i < this.tokens.length; i++) {
                    if (this.tokens[i].symbol === this.asset) {
                        this.amount = this.tokens[i].balance;
                        break;
                    }
                }
            }
        },
        cancel() {
            this.$store.commit("CLEAR_CURRENT_TRANSFER");
            this.$emit("cancelEvent");
        },
        next() {
            if (
                !this.amount ||
                Number(this.amount) === 0 ||
                !this.validAmount
            ) {
                this.$message.error(this.$t("transfer.inputValidAmount"));
                return;
            }
            if (!this.to || !this.validToAddress) {
                this.$message.error(this.$t("transfer.inputValidAddress"));
                return;
            }
            if (
                this.asset === "ONG" &&
                new BigNumber(this.amount)
                    .plus(this.gas)
                    .isGreaterThan(this.balance.ong)
            ) {
                this.$message.error(this.$t("transfer.ongBalanceNotEnough"));
                return;
            }
            if (this.amount) {
                const transfer = {
                    amount: this.amount,
                    to: this.to,
                    gas: this.gas,
                    asset: this.asset,
                    scriptHash: this.scriptHash,
                    decimal: this.decimal,
                    to_chainId: this.to_chainId
                };
                this.$store.commit("UPDATE_TRANSFER", { transfer });
                this.$emit("sendAssetNext");
            }
        }
    }
};
</script>


