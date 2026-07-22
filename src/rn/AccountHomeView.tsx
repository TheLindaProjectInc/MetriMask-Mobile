import "../../shimWrapper.js";

import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, useWindowDimensions, FlatList, ListRenderItemInfo, Modal, TouchableWithoutFeedback } from "react-native";
import { IconButton, TouchableRipple, ProgressBar } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from "@react-navigation/stack";
import DropDownPicker, { ItemType, ValueType} from 'react-native-dropdown-picker';
import { TabView, TabBar, SceneMap, SceneRendererProps, NavigationState, } from 'react-native-tab-view';

import { useCommonStyles, dropDownPickerThemeProps, formatSatoshi, TitleBar, SimpleDoublet, LOADING_STR, NO_INFO_STR, DoubleDoublet, SimpleButton, SimpleButtonPair, AddressQuasiDoublet } from "./common";
import { ThemeColors, useThemeColors } from "./theme";
import { BIG_0, MC, MRX_DECIMALS } from "../mc";
import { WALLET_SCREENS } from "./WalletView";
import { WorkFunctionResult } from "./MainView";
import { TransactionInfo } from "../TransactionLog";
import { MRC20Token } from "../MRC20";
import { USDPriceFinder } from "../USDPriceFinder";
import { NET_ID } from "../NetInfo";



function buildAccountHomeStyles(colors : ThemeColors)
    {
    return StyleSheet.create
        ({
        containingView:
            {
            flexDirection: "column",
            backgroundColor: colors.white,
            margin: 0,
            padding: 0,
            },
        icon:
            {
            margin: 0,
            padding: 0,
            alignSelf: "center"
            },
        dialogOverlay:
            {
            flex: 1,
            backgroundColor: "#00000080",
            alignItems: "center",
            justifyContent: "center",
            },
        dialogCard:
            {
            width: "85%",
            backgroundColor: colors.white,
            borderRadius: 6,
            padding: 24,
            },
        });
    }



export type AccountHomeViewProps =
    {
    onBurgerPressed  : () => any;
    showWorkingAsync : (asyncWorkFunction : (onWorkDone : (result : WorkFunctionResult) => void) => any) => void;
    };

    const PRICE_FINDER               = USDPriceFinder.getFinder();


enum TAB_INDEX
    {
    TRANSACTIONS = 0,
    TOKENS       = 1
    };

enum TAB_KEY
    {
    TRANSACTIONS = "txLog",
    TOKENS       = "tokens"
    };

type TabRoute =
    {
    key   : string;
    title : string;
    };

const tabRoutes : TabRoute[] =
    [
    { key: TAB_KEY.TRANSACTIONS, title: 'Transactions' },
    { key: TAB_KEY.TOKENS,       title: 'MRC20 Tokens' },
    ];



let onDisplay : boolean = false;
let tokenRefreshPending : boolean = false;
let tokenRefreshInProgress : boolean = false;
let nonce : number = 1;

export function AccountHomeView(props : AccountHomeViewProps) : JSX.Element
    {
    const walletNavigation = useNavigation<StackNavigationProp<any>>();
    const colors = useThemeColors();
    const commonStyles = useCommonStyles();
    const accountHomeStyles = buildAccountHomeStyles(colors);
    const mc = MC.getMC();
    const am = mc.storage.accountManager;
    let sceneMapObj : any = { };
    sceneMapObj[TAB_KEY.TRANSACTIONS] = ShowTxLog;
    sceneMapObj[TAB_KEY.TOKENS] = ShowTokens;
    const tabSceneMap = SceneMap(sceneMapObj);

    const [ accountDDOpen, setAccountDDOpen ] = useState<boolean>(false);
    const [ accountDDValue, setAccountDDValue ] = useState<ValueType | null>(am.current.accountName);
    const [ accountDDItems, setAccountDDItems ] = useState<ItemType<string>[]>(am.accountDropDownItems);

    const [ balance, setBalance ] = useState<string>(formatBalance());
    const [ balanceUSD, setBalanceUSD ] = useState<string>(formatBalanceUSD());
    const [ unconfirmedBalance, setUnconfirmedBalance ] = useState<string>(formatUnconfirmedBalance());
    const [ tabIndex, _setTabIndex ] = useState<TAB_INDEX>(TAB_INDEX.TRANSACTIONS);
    const [ disableMoreTxs, setDisableMoreTxs ] = useState<boolean>(false);
    const [ txLogTickler, setTxLogTickler ] = useState<boolean>(false);
    const [ tokenTickler, setTokenTickler ] = useState<boolean>(false);
    const [ txLoadInProgress, setTxLoadInProgress ] = useState<boolean>(false);
    const [ selectedTx, setSelectedTx ] = useState<TransactionInfo | null>(null);

    const layout = useWindowDimensions();
    if (disableMoreTxs != txLoadInProgress) setDisableMoreTxs(txLoadInProgress);

    useEffect(() : (() => void) =>
        {
        onDisplay = true;
        if (tokenRefreshPending)
            {
            tokenRefreshPending = false;
            refreshTokenBalances();
            }
        updateBalances();
        const balanceNRef : number = am.startBalanceNotifications(updateBalances);
        const txLogNRef : number = tabIndex == TAB_INDEX.TRANSACTIONS ? am.startTxLogNotifications(updateTxs) : 0;
        const tokensNRef : number = tabIndex == TAB_INDEX.TOKENS ? am.startAllTokensNotifications(updateTokens) : 0;
        return () : void =>
            {
            onDisplay = false;
            am.stopBalanceNotifications(balanceNRef);
            if (txLogNRef) am.stopTxLogNotifications(txLogNRef);
            if (tokensNRef) am.stopAllTokensNotifications(tokensNRef);
            }
        });

    function setTabIndex(index : TAB_INDEX) : void
        {
        if (tabIndex != TAB_INDEX.TOKENS && index == TAB_INDEX.TOKENS) tokenRefreshPending = true;
        _setTabIndex(index);
        }

    function updateBalances() : void
        {
        const newBalanceStr = formatBalance();
        if (balance != newBalanceStr) setBalance(newBalanceStr);
        const newBalanceUSDStr = formatBalanceUSD();
        if (balanceUSD != newBalanceUSDStr) setBalanceUSD(newBalanceUSDStr);
        const newUnconfirmedStr = formatUnconfirmedBalance();
        if (unconfirmedBalance != newUnconfirmedStr) setUnconfirmedBalance(newUnconfirmedStr);
        }

    function formatBalance() : string
        {
        return am.current.wm.balanceSat >= BIG_0 ? formatSatoshi(am.current.wm.balanceSat, MRX_DECIMALS) : LOADING_STR;
        }

    function formatBalanceUSD() : string
        {
        return am.current.wm.balanceUSD;
        }

    function formatUnconfirmedBalance() : string
        {
        return am.current.wm.unconfirmedBalanceSat >= BIG_0 ? formatSatoshi(am.current.wm.unconfirmedBalanceSat, MRX_DECIMALS) : LOADING_STR;
        }

    function updateTxs() : void
        {
        setTxLogTickler(!txLogTickler);
        }

    function updateTokens() : void
        {
        setTokenTickler(!tokenTickler);
        }

    function refreshTokenBalances() : void
        {
        if (!tokenRefreshInProgress && !txLoadInProgress)
            {
            tokenRefreshInProgress = true;
            const myNonce = nonce;
            am.current.refreshAllTokenBalances().then((changed : boolean) : void =>
                {
                tokenRefreshInProgress = false;
                if (myNonce == nonce && onDisplay && tabIndex == TAB_INDEX.TOKENS) updateTokens();
                })
            .catch((e : any) : void =>
                {
                tokenRefreshInProgress = false;
                MC.raiseError(e, "AccountHomeView refreshTokenBalances()");
                });
            }
        }

    function onSelectAccount(item : ItemType<string>) : void
        {
        if (item.value != am.current.accountName)
            {
            nonce++;
            if (am.setCurrentAccountNeedsWork(item.value as string))
                {
                props.showWorkingAsync((onWorkDone : (result : WorkFunctionResult) => void) : void =>
                    {
                    am.setCurrentAccount(item.value as string);
                    am.current.finishLoad().then(() : void =>
                        {
                        if (tabIndex == TAB_INDEX.TOKENS) tokenRefreshPending = true;
                        onWorkDone({ nextScreen: WALLET_SCREENS.ACCOUNT_HOME });
                        })
                    .catch((e : any) : void =>
                        {
                        MC.raiseError(e, `AccountHomeView onSelectAccount()`);
                        });
                    });
                }
            else
                {
                am.setCurrentAccount(item.value as string);
                if (tabIndex == TAB_INDEX.TOKENS) tokenRefreshPending = true;
                }
            }
        }

    function onRemoveToken(tk : MRC20Token) : void
        {
        am.current.tkm.removeToken(tk.address);
        am.saveSelf();
        setTokenTickler(!tokenTickler);
        }

    function onSelectTx(ti : TransactionInfo) : void
        {
        setSelectedTx(ti);
        }

    function onDismissTxDialog() : void
        {
        setSelectedTx(null);
        }

    function onOpenExplorer(ti : TransactionInfo) : void
        {
        setSelectedTx(null);
        mc.openUrlInNewTab(am.current.wm.ninfo.toTxUrl(ti.id));
        }

    function onShowToken(tk : MRC20Token) : void
        {
        mc.openUrlInNewTab(am.current.wm.ninfo.toTokenUrl(tk.address));
        }

    function onLoadMoreTxs() : void
        {
        if (!tokenRefreshInProgress && !txLoadInProgress)
            {
            setTxLoadInProgress(true);
            const myNonce = nonce;
            am.current.extendTxLog().then((canLoadMoreTxs : boolean) : void =>
                {
                setTxLoadInProgress(false);
                if (myNonce == nonce && onDisplay && tabIndex == TAB_INDEX.TRANSACTIONS) updateTxs();
                })
            .catch((e : any) : void =>
                {
                setTxLoadInProgress(false);
                MC.raiseError(e, "AccountHomeView.onLoadMoreTxs()");
                });
            }
        }

    function onSend() : void
        {
        nonce++;
        walletNavigation.navigate(WALLET_SCREENS.SEND);
        }

    function onReceive() : void
        {
        nonce++;
        walletNavigation.navigate(WALLET_SCREENS.RECEIVE);
        }

    function onBurgerPressed() : void
        {
        props.onBurgerPressed();
        }

    function ShowTxLog() : JSX.Element
        {
        function renderItem(param : ListRenderItemInfo<TransactionInfo>) : JSX.Element
            {
            const ti : TransactionInfo = param.item;
            const isNegative : boolean = ti.valueSat < BIG_0;
            const valueColor : string = isNegative ? colors.red : colors.black;

            function renderUSD() : JSX.Element | null
                {
                if (am.current.wm.ninfo.id != NET_ID.MAIN) return null;
                const value : bigint = isNegative ? -ti.valueSat : ti.valueSat;
                const valueUSD : string = PRICE_FINDER.satoshiToUSD(value);
                if (!valueUSD) return null;
                return (<Text style={{ color: valueColor }}> ({ (isNegative ? "-$ " : "$ ") + valueUSD })</Text>);
                }
        
            function renderTxLogEntry(ti : TransactionInfo) : JSX.Element
                {
                const directionIcon  : string = isNegative ? "arrow-up-bold" : "arrow-down-bold";
                const directionColor : string = isNegative ? colors.red : colors.dullGreen;
                return (
                    <TouchableRipple rippleColor={ colors.purpleRipple } onPress={ () : void => onSelectTx(ti) }>
                        <View style={{ width: "100%", paddingLeft: 24, paddingRight: 24, paddingTop: 9, paddingBottom: 9 }}>
                            <View style={ commonStyles.rowContainer }>
                                <MaterialCommunityIcons name={ directionIcon } color={ directionColor } size={ 16 } style={{ alignSelf: "center", marginRight: 6 }}/>
                                <Text style={{ color: valueColor }}>{ formatSatoshi(ti.valueSat, MRX_DECIMALS) }</Text>
                                { renderUSD() }
                                <View style={{ flex: 1 }}/>
                                <Text style={{ color: colors.black }}>{ ti.dateTimeStr }</Text>
                            </View>
                            <Text style={{ color: colors.middleGrey }} numberOfLines={ 1 } ellipsizeMode="middle">{ ti.id }</Text>
                        </View>
                    </TouchableRipple>
                    );
                }

            if (param.index + 1 == am.current.txLog.log.length && am.current.txLog.canLoadMoreTxs)
                return (
                    <>
                        { renderTxLogEntry(ti) }
                        <View style={{ height: 3, backgroundColor: colors.lightGrey }}/>
                        <View style={{ height: 24 }}/>
                        <View style={ commonStyles.squeezed }>
                            <SimpleButton text="Load More Transactions" disabled={ disableMoreTxs } onPress = { onLoadMoreTxs }/>
                        </View>
                        <View style={{ height: 24 }}/>
                    </>
                    );
            else
                return (
                    <>
                        { renderTxLogEntry(ti) }
                        <View style={{ height: 3, backgroundColor: colors.lightGrey }}/>
                    </>
                    );
            }

        return (
            <FlatList<TransactionInfo> data={ am.current.txLog.log } renderItem={ renderItem } keyExtractor={ (item : TransactionInfo) : string => item.id } extraData={ txLogTickler }/>
            );
        }

    function ShowTokens() : JSX.Element
        {
        function renderItem(param : ListRenderItemInfo<MRC20Token>) : JSX.Element
            {
            const mrc20 : MRC20Token = param.item;
            const name = mrc20.name.length ? mrc20.name : mrc20.address;
            const balance = mrc20.infoIsValid ? formatSatoshi(mrc20.balanceSat, mrc20.decimals) + " " + mrc20.symbol : NO_INFO_STR;
            return (
                <TouchableRipple style={{ flex: 1 }} rippleColor={ colors.purpleRipple } onPress={ () : void => onShowToken(mrc20) }>
                    <View>
                        <View style={ commonStyles.rowContainer }>
                            <View style={{ paddingLeft: 24, paddingRight: 0, paddingTop: 9, paddingBottom: 9 }}>
                                <Text style={{ color: colors.black }}>{ name }</Text>
                                <Text style={{ color: colors.middleGrey }}>{ balance }</Text>
                            </View>
                            <View style={{ flex: 1 }}/>
                            <View style={ accountHomeStyles.containingView }>
                                <IconButton rippleColor={ colors.purpleRipple } style={ commonStyles.icon } size={ 24 } icon="close" onPress={ () : void => onRemoveToken(mrc20) }/>
                                <View style={{ flex: 1 }}/>
                            </View>
                        </View>
                        <View style={{ height: 3, backgroundColor: colors.lightGrey }}/>
                    </View>
                </TouchableRipple>
                );
            }

        return (
            <FlatList<MRC20Token> data={ am.current.tkm.tokenArray } renderItem={ renderItem } keyExtractor={ (item : MRC20Token) : string => item.address } extraData={ tokenTickler }/>
            );
        }

    function renderTabBar(props : SceneRendererProps & { navigationState : NavigationState<TabRoute>; }) : JSX.Element
        {
        return (
            <TabBar
                { ...props }
                activeColor={ colors.black }
                inactiveColor={ colors.middleGrey }
                indicatorStyle={{ backgroundColor: colors.darkPurple }}
                style={{ backgroundColor: colors.lightishPurple }}
                />
            );
        }

    function DividerBar() : JSX.Element
        {
        if (disableMoreTxs)
            return (<ProgressBar style={{ height: 3 }} indeterminate color={ colors.darkPurple } />);
        else
            return (<ProgressBar style={{ height: 3 }} progress={ 1 } color={ colors.darkPurple } />);
        }

    function renderBalanceUSD() : JSX.Element | null
        {
        if (balanceUSD)
            return (<Text style={{ color: colors.black }}>{ "$ " + balanceUSD }</Text>);
        else
            return null;
        }

    function renderTxDetailsDialog() : JSX.Element | null
        {
        if (!selectedTx) return null;
        const ti : TransactionInfo = selectedTx;
        const isNegative     : boolean = ti.valueSat < BIG_0;
        const directionText  : string  = isNegative ? "Sent" : "Received";
        const directionColor : string  = isNegative ? colors.red : colors.dullGreen;
        const directionIcon  : string  = isNegative ? "arrow-up-bold" : "arrow-down-bold";

        return (
            <Modal visible={ true } transparent={ true } animationType="fade" onRequestClose={ onDismissTxDialog }>
                <TouchableWithoutFeedback onPress={ onDismissTxDialog }>
                    <View style={ accountHomeStyles.dialogOverlay }>
                        <TouchableWithoutFeedback onPress={ () : void => { } }>
                            <View style={ accountHomeStyles.dialogCard }>
                                <View style={ commonStyles.rowContainer }>
                                    <MaterialCommunityIcons name={ directionIcon } color={ directionColor } size={ 20 } style={{ alignSelf: "center", marginRight: 6 }}/>
                                    <Text style={{ color: directionColor, fontWeight: "bold", alignSelf: "center" }}>{ directionText }</Text>
                                </View>
                                <View style={{ height: 16 }}/>
                                <SimpleDoublet title="Amount:" text={ formatSatoshi(ti.valueSat, MRX_DECIMALS) + " MRX" }/>
                                <View style={{ height: 12 }}/>
                                <SimpleDoublet title="Date:" text={ ti.dateTimeStr }/>
                                <View style={{ height: 12 }}/>
                                <SimpleDoublet title="Confirmations:" text={ ti.confirmations.toString() }/>
                                <View style={{ height: 12 }}/>
                                <Text style={{ color: colors.middleGrey }}>Transaction Hash:</Text>
                                <TouchableRipple rippleColor={ colors.purpleRipple } onPress={ () : void => onOpenExplorer(ti) }>
                                    <Text style={{ color: colors.darkPurple, textDecorationLine: "underline" }} numberOfLines={ 1 } ellipsizeMode="middle">{ ti.id }</Text>
                                </TouchableRipple>
                                <View style={{ height: 24 }}/>
                                <SimpleButton text="Close" onPress={ onDismissTxDialog }/>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
            );
        }

    return (
         <View style={ commonStyles.containingView }>
            <TitleBar title="Account Home" onBurgerPressed={ onBurgerPressed }/>
            <View style={ commonStyles.horizontalBar }/>
            <View style={{ height: 20 }} />
            <View style={ commonStyles.squeezed }>
                <Text style={{ color: colors.middleGrey}}>Account:</Text>
                <DropDownPicker
                    { ...(dropDownPickerThemeProps(colors) as any) }
                    maxHeight={ 200 }
                    items={ accountDDItems }
                    open={ accountDDOpen }
                    value={ accountDDValue as string }
                    setOpen={ setAccountDDOpen }
                    setValue={ setAccountDDValue }
                    setItems={ setAccountDDItems }
                    onSelectItem={ onSelectAccount }
                    />
                <View style={{ height: 24 }} />
                <DoubleDoublet titleL="Network:" textL={ am.current.wm.ninfo.name } titleR="Unconfirmed MRX:" textR={ unconfirmedBalance }/>
                <View style={{ height: 7 }} />
                <AddressQuasiDoublet title="Address:" acnt={ am.current }/>
                <View style={{ height: 7 }} />
                <SimpleDoublet title="MRX Balance:" text={ balance } />
                { renderBalanceUSD() }
                <View style={{ height: 24 }} />
                <SimpleButtonPair left={{ text: "Send", icon: "debug-step-out", onPress: onSend }} right={{ text: "Receive", icon: "debug-step-into", onPress: onReceive }}/>
                <View style={{ height: 24 }} />
            </View>
            <DividerBar/>
            <TabView navigationState={{ index: tabIndex, routes: tabRoutes }} renderScene={ tabSceneMap } onIndexChange={ setTabIndex } initialLayout={{ width: layout.width }} renderTabBar={ renderTabBar }/>
            { renderTxDetailsDialog() }
        </View>
        );
    }
