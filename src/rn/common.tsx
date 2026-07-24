import "../../shimWrapper.js";

import React, { useMemo } from "react";
import { View, Text, Alert, Platform, BackHandler, StyleSheet, NativeSyntheticEvent, TextInputEndEditingEventData, TextInput } from "react-native";
import { TextInput as PaperTextInput, IconButton, TouchableRipple } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { ItemType } from "react-native-dropdown-picker";

import { BIG_0 } from "../mc";
import { Account } from "../Account";
import { NetInfo, NetInfoManager, NET_ID, nim } from "../NetInfo";
import { ThemeColors, useThemeColors } from "./theme";



export function buildCommonStyles(colors : ThemeColors)
    {
    return StyleSheet.create
        ({
        containingView:
            {
            flex: 1,
            flexDirection: "column",
            backgroundColor: colors.white,
            margin: 0,
            padding: 0,
            },
        centeringView:
            {
            alignItems: "center",
            marginLeft: 24,
            marginRight: 24,
            },
        rowContainer:
            {
            flexDirection: "row",
            margin: 0,
            padding: 0,
            alignContent: "center",
            },
        columnContainerV2:
            {
            flexDirection: "column",
            margin: 0,
            padding: 0,
            alignContent: "center",
            },
        borderedScroller:
            {
            flex: 1,
            padding: 6,
            // Border sides spelled out individually rather than borderWidth/borderColor shorthand
            // -- see the comment in dropDownPickerThemeProps() for why.
            borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
            borderRadius: 4,
            borderTopColor: colors.darkishPurple, borderRightColor: colors.darkishPurple, borderBottomColor: colors.darkishPurple, borderLeftColor: colors.darkishPurple,
            },
        icon:
            {
            margin: 0,
            padding: 0,
            },
        topBar:
            {
            height: 52,
            backgroundColor: colors.white,
            flexDirection: "row",
            alignItems: "center",
            elevation: 3,
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 3,
            },
        titleContainingView:
            {
            alignItems: "center",
            flex: 5,
            },
        titleText:
            {
            fontSize: 21,
            color: colors.black,
            fontWeight: "bold",
            letterSpacing: 0.3,
            },
        horizontalBar:
            {
            height: 3,
            backgroundColor: colors.darkPurple,
            },
        card:
            {
            backgroundColor: colors.lightPurple,
            // Border sides spelled out individually rather than borderWidth/borderColor shorthand
            // -- see the comment in dropDownPickerThemeProps() for why.
            borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
            borderTopColor: colors.lightishPurple, borderRightColor: colors.lightishPurple, borderBottomColor: colors.lightishPurple, borderLeftColor: colors.lightishPurple,
            borderRadius: 14,
            padding: 16,
            },
        squeezed:
            {
            marginLeft: 24,
            marginRight: 24,
            },
        invalidView:
            {
            flexDirection: "row",
            },
        invalidViewText:
            {
            padding: 24,
            color: colors.black,
            backgroundColor: colors.redWash,
            fontWeight: "bold",
            },
        validViewText:
            {
            padding: 24,
            color: colors.black,
            backgroundColor: colors.greenWash,
            fontWeight: "bold",
            },
        flex1:
            {
            flex: 1,
            margin: 0,
            padding: 0,
            },
        });
    }

export function useCommonStyles() : ReturnType<typeof buildCommonStyles>
    {
    const colors = useThemeColors();
    return useMemo(() : ReturnType<typeof buildCommonStyles> => buildCommonStyles(colors), [ colors ]);
    }

export function dropDownPickerThemeProps(colors : ThemeColors)
    {
    // Border sides are spelled out individually (rather than the borderColor/borderWidth
    // shorthand) because the shorthand form intermittently drops the bottom edge of the box
    // under Android Fabric when combined with borderRadius.
    const fullBorder =
        {
        borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
        borderTopColor: colors.darkishPurple, borderRightColor: colors.darkishPurple, borderBottomColor: colors.darkishPurple, borderLeftColor: colors.darkishPurple,
        };
    return (
        {
        style: { ...fullBorder, backgroundColor: colors.white },
        textStyle: { color: colors.black },
        placeholderStyle: { color: colors.middleGrey },
        dropDownContainerStyle: { ...fullBorder, backgroundColor: colors.white },
        listItemLabelStyle: { color: colors.black },
        selectedItemLabelStyle: { color: colors.darkPurple },
        arrowIconStyle: { tintColor: colors.black },
        tickIconStyle: { tintColor: colors.darkPurple },
        });
    }



export const LOADING_STR = "";
export const NO_INFO_STR = "< Failed to Load >";



export function normalizeProps(props : any) : any
    {
    return (props.route && props.route.params && (typeof props.route.params === "object")) ? props.route.params : props;
    }



export function handleHardwareBackPress() : () => void
    {
    return backHandler(false);
    }

export function handleHardwareBackPressNoExit() : () => void
    {
    return backHandler(false);
    }

let alertOut : boolean = false;

function backHandler(showExitOption : boolean) : () => void
    {
    if (Platform.OS === "android")
        {
        const onBackPress = () : boolean =>
            {
            if (showExitOption && !alertOut)
                {
                alertOut = true;
                Alert.alert("Exit MetriMask", "Are you sure you want to exit?",
                    [
                    { text: "Don't Exit", style: "cancel", onPress: () : void => { alertOut = false;                       } },
                    { text: "Exit",                        onPress: () : void => { alertOut = false; BackHandler.exitApp() } }
                    ]);
                }
            return true;
            };
        const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress);
        return () : void => { backHandler.remove(); }
        }
    else
        return () : void => { ; };
    }



export function netInfoDropDownItems() : ItemType<number>[]
    {
    const niman : NetInfoManager = nim();
    const items : ItemType<number>[] = [ ];
    for (let i = 0; i < NET_ID.length; i++)
        {
        const ni : NetInfo = niman.fromId(i);
        items.push({ label: ni.name, value: ni.id } );
        }
    return items;
    }



export type InvalidMessageProps =
    {
    text: string;
    }

export function InvalidMessage(props : InvalidMessageProps) : JSX.Element
    {
    const commonStyles = useCommonStyles();
    return (
        <View style={ commonStyles.invalidView }>
            <View style={{ flex: 1 }}/>
            <Text style={ commonStyles.invalidViewText }>{ props.text }</Text>
            <View style={{ flex: 1 }}/>
        </View>
        );
    }

export type ValidMessageProps =
    {
    text: string;
    }

export function ValidMessage(props : ValidMessageProps) : JSX.Element
    {
    const commonStyles = useCommonStyles();
    return (
        <View style={ commonStyles.invalidView }>
            <View style={{ flex: 1 }}/>
            <Text style={ commonStyles.validViewText }>{ props.text }</Text>
            <View style={{ flex: 1 }}/>
        </View>
        );
    }



export type CardProps =
    {
    style?    : any;
    children? : React.ReactNode;
    }

// Groups related content into a visually distinct, rounded panel (tinted purple wash) so
// screens with several info blocks (account summary, settings) read as sections rather than
// one flat list of rows.
export function Card(props : CardProps) : JSX.Element
    {
    const commonStyles = useCommonStyles();
    return (<View style={ [ commonStyles.card, props.style ] }>{ props.children }</View>);
    }



export type TitleBarProps =
    {
    title           : string;
    onBurgerPressed : () => any;
    }

export function TitleBar(props : TitleBarProps) : JSX.Element
    {
    const colors = useThemeColors();
    const commonStyles = useCommonStyles();
    return (
        <View style={ commonStyles.topBar }>
            <IconButton style={ commonStyles.icon } iconColor={ colors.black } rippleColor={ colors.purpleRipple } size={ 24 } icon="menu" onPress={ props.onBurgerPressed }/>
            <View style={ commonStyles.titleContainingView }>
                <Text style={ commonStyles.titleText }>{ props.title }</Text>
            </View>
            <IconButton style={ commonStyles.icon } iconColor={ colors.white } size={ 24 } icon="menu"/>
        </View>
        );
    }



export type BurgerlessTitleBarProps =
    {
    title : string;
    }

export function BurgerlessTitleBar(props : BurgerlessTitleBarProps) : JSX.Element
    {
    const commonStyles = useCommonStyles();
    return (
        <View style={ commonStyles.topBar }>
            <View style={ commonStyles.titleContainingView }>
                <Text style={ commonStyles.titleText }>{ props.title }</Text>
            </View>
        </View>
        );
    }



export type SimpleDoubletProps =
    {
    title    : string;
    text     : string;
    icon?    : string;
    onPress? : () => any;
    }

export function SimpleDoublet(props : SimpleDoubletProps) : JSX.Element
    {
    const colors = useThemeColors();
    const commonStyles = useCommonStyles();
    if (props.icon)
        {
        return (
            <View style={ commonStyles.rowContainer }>
                <View style={ commonStyles.columnContainerV2 }>
                    <View style={ commonStyles.flex1 }/>
                    <Text style={{ color: colors.middleGrey }}>{ props.title }</Text>
                    <Text style={{ color: colors.black }}>{ props.text }</Text>
                </View>
                <View style={{ width: 3 }}/>
                <View style={ commonStyles.columnContainerV2 }>
                    <View style={ commonStyles.flex1 }/>
                    <IconButton style={ commonStyles.icon } iconColor={ colors.black } rippleColor={ colors.purpleRipple } size={ 24 } icon={ props.icon } onPress={ props.onPress }/>
                </View>
                <View style={ commonStyles.flex1 }/>
            </View>
            );
        }
    else
        return (
            <>
                <Text style={{ color: colors.middleGrey }}>{ props.title }</Text>
                <Text style={{ color: colors.black }}>{ props.text }</Text>
            </>
            );
    }



export type AddressQuasiDoubletProps =
    {
    title    : string;
    acnt?    : Account;
    address? : string;
    mnsName? : string;
    icon?    : string;
    onPress? : () => any;
    }

export function AddressQuasiDoublet(props : AddressQuasiDoubletProps) : JSX.Element
    {
    const colors = useThemeColors();
    const commonStyles = useCommonStyles();
    const address : string = props.acnt ? props.acnt.wm.address : (props.address ? props.address : "");
    const mnsName : string = props.acnt ? props.acnt.wm.mnsNmae : (props.mnsName ? props.mnsName : "");

    function renderMnsName() : JSX.Element | null
        {
        if (mnsName.length)
            return (<Text style={{ color: colors.black }}>{ mnsName }</Text>);
        else
            return null;
        }

    if (props.icon)
        {
        return (
            <View style={ commonStyles.rowContainer }>
                <View style={ commonStyles.columnContainerV2 }>
                    <View style={ commonStyles.flex1 }/>
                    <Text style={{ color: colors.middleGrey }}>{ props.title }</Text>
                    { renderMnsName() }
                    <Text style={{ color: colors.black }}>{ address }</Text>
                </View>
                <View style={{ width: 3 }}/>
                <View style={ commonStyles.columnContainerV2 }>
                    <View style={ commonStyles.flex1 }/>
                    <IconButton style={ commonStyles.icon } iconColor={ colors.black } rippleColor={ colors.purpleRipple } size={ 24 } icon={ props.icon } onPress={ props.onPress }/>
                </View>
                <View style={ commonStyles.flex1 }/>
            </View>
            );
        }
    else
        {
        return (
            <>
                <Text style={{ color: colors.middleGrey }}>{ props.title }</Text>
                { renderMnsName() }
                <Text style={{ color: colors.black }}>{ address }</Text>
            </>
            );
        }
    }



export type DoubleDoubletProps =
    {
    titleL : string;
    textL  : string;
    titleR : string;
    textR  : string;
    };

export function DoubleDoublet(props : DoubleDoubletProps) : JSX.Element
    {
    const commonStyles = useCommonStyles();
    return (
        <View style={ commonStyles.rowContainer }>
            <View style={ commonStyles.flex1 }>
                <SimpleDoublet title={ props.titleL } text={ props.textL } />
                <View style={ commonStyles.flex1 } />
            </View>
            <View style={ commonStyles.flex1 }>
                <SimpleDoublet title={ props.titleR } text={ props.textR } />
                <View style={ commonStyles.flex1 } />
            </View>
        </View>
        );
    }



export type SimpleTextInputProps =
    {
    label              : string;
    keyboardType?      : string;
    value              : string;
    placeholder?       : string;
    icon?              : string;
    secureTextEntry?   : boolean;
    multiline?         : boolean;
    textAlignVertical? : "auto" | "top" | "bottom" | "center";
    rnRef?             : React.Ref<TextInput>;
    onChangeText?      : (text : string) => void;
    onEndEditing?      : (nsEvent : NativeSyntheticEvent<TextInputEndEditingEventData>) => void;
    onFocus?           : () => any;
    onPressIcon?       : () => any;
    };

export function SimpleTextInput(props : SimpleTextInputProps) : JSX.Element
    {
    const colors = useThemeColors();
    const icon = props.icon;
    const onPressIcon = props.onPressIcon;
    if (props.rnRef) (props as any).ref = props.rnRef;
    delete props["icon"];
    delete props["onPressIcon"];
    delete props["rnRef"];
    // Paper's TextInput isn't wrapped in a PaperProvider, so without an explicit `theme` override
    // it always falls back to Paper's own default LIGHT theme for its fill/label colors, regardless
    // of our app's dark mode.
    const paperTheme = { colors: { surfaceVariant: colors.lightGrey, onSurfaceVariant: colors.middleGrey } };
    if (icon && onPressIcon)
        return  (
            <PaperTextInput
                { ...(props as any) }
                theme={ paperTheme }
                textColor={ colors.black }
                selectionColor={ colors.darkPurple }
                underlineColor={ colors.darkishPurple }
                activeUnderlineColor={ colors.darkPurple }
                right={ (<PaperTextInput.Icon icon={ icon } onPress={ onPressIcon }/>) }/>
            );
    else
        return  (
            <PaperTextInput
                { ...(props as any) }
                theme={ paperTheme }
                textColor={ colors.black }
                selectionColor={ colors.darkPurple }
                underlineColor={ colors.darkishPurple }
                activeUnderlineColor={ colors.darkPurple }/>
            );
    }



export type SimpleTextInputPairProps =
    {
    left  : SimpleTextInputProps;
    right : SimpleTextInputProps;
    }

export function SimpleTextInputPair(props : SimpleTextInputPairProps) : JSX.Element
    {
    const commonStyles = useCommonStyles();
    return (
        <View style={ commonStyles.rowContainer }>
            <View style={ commonStyles.flex1 }>
                <SimpleTextInput { ...props.left } />
            </View>
            <View style={{ width: 24 }} />
            <View style={ commonStyles.flex1 }>
                <SimpleTextInput { ...props.right } />
            </View>
        </View>
        );
    }



export type SimpleButtonProps =
    {
    text?     : string;
    icon?     : string;
    disabled? : boolean;
    variant?  : "primary" | "secondary" | "danger";
    onPress   : () => void;
    }

export function SimpleButton(props : SimpleButtonProps) : JSX.Element
    {
    const colors = useThemeColors();
    const commonStyles = useCommonStyles();
    const text = props.text;
    const variant = props.variant ? props.variant : "secondary";
    delete (props as any)["text"];
    delete (props as any)["variant"];
    if (text)
        // Deliberately built from primitives (View/TouchableRipple) rather than react-native-paper's
        // Button: Paper's outlined Button wraps content in a Surface driven by an Animated.Value
        // elevation (even at value 0), and that Surface/elevation machinery intermittently fails to
        // draw the bottom edge of the border under Fabric on Android. Plain primitives sidestep it.
        {
        const isPrimary : boolean = variant == "primary" && !props.disabled;
        const isDanger  : boolean = variant == "danger";
        const borderColor  : string = props.disabled ? colors.middleGrey : (isDanger ? colors.red : colors.darkishPurple);
        const bgColor       = isPrimary ? colors.darkPurple : undefined;
        const textColor : string = props.disabled ? colors.middleGrey : (isPrimary ? "#FFFFFF" : (isDanger ? colors.red : colors.black));
        const iconColor : string = props.disabled ? colors.middleGrey : (isPrimary ? "#FFFFFF" : (isDanger ? colors.red : colors.darkPurple));
        const rippleColor : string = isDanger ? colors.redWash : (isPrimary ? colors.darkPurpleRipple : colors.purpleRipple);
        return (
            // Border sides spelled out individually rather than borderWidth/borderColor shorthand
            // -- see the comment in dropDownPickerThemeProps() for why.
            <View style={{ backgroundColor: bgColor, borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1, borderTopColor: borderColor, borderRightColor: borderColor, borderBottomColor: borderColor, borderLeftColor: borderColor, borderRadius: 20, overflow: "hidden" }}>
                <TouchableRipple rippleColor={ rippleColor } onPress={ props.onPress } disabled={ props.disabled }>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 9, paddingHorizontal: 16 }}>
                        { props.icon ? <MaterialCommunityIcons name={ props.icon } color={ iconColor } size={ 18 } style={{ marginRight: 8 }}/> : null }
                        <Text style={{ color: textColor, fontWeight: isPrimary ? "600" : "normal" }}>{ text }</Text>
                    </View>
                </TouchableRipple>
            </View>
            );
        }
    else if (props.icon)
        return (
            <IconButton { ...(props as any) } iconColor={ colors.black } style={ commonStyles.icon } size={ 24 }/>
            );
    else
        return (
            <IconButton { ...(props as any) } iconColor={ colors.black } style={ commonStyles.icon } size={ 24 } icon="help"/>
            );
    }



export type SimpleButtonPairProps =
    {
    left  : SimpleButtonProps;
    right : SimpleButtonProps;
    }

export function SimpleButtonPair(props : SimpleButtonPairProps) : JSX.Element
    {
    const commonStyles = useCommonStyles();
    return (
        <View style={ commonStyles.rowContainer }>
            <View style={ commonStyles.flex1 }>
                <SimpleButton { ...props.left } />
            </View>
            <View style={{ width: 24 }} />
            <View style={ commonStyles.flex1 }>
                <SimpleButton { ...props.right } />
            </View>
        </View>
        );
    }



export type MenuOptionProps =
    {
    icon      : string;
    label     : string;
    disabled? : boolean;
    onPress   : () => void;
    }

export function MenuOption(props : MenuOptionProps) : JSX.Element
    {
    const colors = useThemeColors();
    if (props.disabled)
        return (
            <View style={{ flexDirection: "row", margin: 0, borderWidth: 0, padding: 0 }}>
                <View style={{ width: 12 }}/>
                <IconButton icon={ props.icon } iconColor={ colors.middleGrey } disabled={ true } size={ 24 } style={{ margin: 0, padding: 0, borderWidth: 0 }}/>
                <Text style={{ color: colors.middleGrey, paddingTop: 12, paddingBottom: 12, paddingLeft: 6, paddingRight: 18 }}>{ props.label }</Text>
            </View>
            );
    else
        // Wrapped in a rounded, inset View so the ripple clips to a "pill row" shape (Material 3
        // nav-drawer style) instead of bleeding edge-to-edge across the drawer.
        return (
            <View style={{ marginHorizontal: 8, marginVertical: 2, borderRadius: 12, overflow: "hidden" }}>
                <TouchableRipple onPress={ props.onPress } rippleColor={ colors.darkPurpleRipple }>
                    <View style={{ flexDirection: "row", margin: 0, borderWidth: 0, padding: 0 }}>
                        <View style={{ width: 12 }}/>
                        <IconButton icon={ props.icon } iconColor={ colors.black } size={ 24 } style={{ margin: 0, padding: 0, borderWidth: 0 }}/>
                        <Text style={{ color: colors.black, paddingTop: 12, paddingBottom: 12, paddingLeft: 6, paddingRight: 18 }}>{ props.label }</Text>
                    </View>
                </TouchableRipple>
            </View>
            );
    }



const CC_0     = "0".charCodeAt(0);
const CC_1     = "1".charCodeAt(0);
const CC_9     = "9".charCodeAt(0);
const CC_DOT   = ".".charCodeAt(0);
const CC_COMMA = ",".charCodeAt(0);

export function formatSatoshi(n : bigint | number | string, decimals : number) : string
    {
    switch (typeof n)
        {
        case "number": return formatSmallSatoshi(n, decimals);
        case "string": return formatStringSatoshi(n, decimals);
        default:       return formatBigSatoshi(n, decimals);
        }
    }

export function formatSmallSatoshi(n : number, decimals : number) : string
    {
    if (n > 0)
        return formatStringSatoshi(Math.round(n).toString(), decimals);
    else if (n < 0)
        return `-` + formatStringSatoshi(Math.round(-n).toString(), decimals);
    else
        return `0.0`;
    }

export function formatBigSatoshi(n : bigint, decimals : number) : string
    {
    if (n > BIG_0)
        return formatStringSatoshi(n.toString(), decimals);
    else if (n < BIG_0)
        return `-` + formatStringSatoshi((-n).toString(), decimals);
    else
        return `0.0`;
    }

export function formatStringSatoshi(satStr : string, decimals : number) : string
    {
    let negative = false;
    if (satStr.substring(0, 1) == `-`)
        {
        negative = true;
        satStr = satStr.substring(1);
        }
    if (satStr.length > decimals)
        {
        const leading = satStr.length - decimals;
        satStr = satStr.substring(0, leading) + `.` + (leading == satStr.length ? "0" : satStr.substring(leading));
        }
    else
        {
        while (satStr.length < decimals) satStr = `0` + satStr;
        satStr = `0.` + satStr;
        }
    let len = satStr.length - 1;
    while (satStr.charCodeAt(len) == CC_0) len--;
    if (satStr.charCodeAt(len) == CC_DOT)
        {
        satStr += "0";
        len++;
        }
    satStr = negative ? `-` + satStr.substring(0, len + 1) : satStr.substring(0, len + 1);
    if (decimals == 0 && satStr.charAt(satStr.length - 2) == ".") satStr = satStr.substring(0, satStr.length - 2);
    return satStr;
    }

export function noumberOfDecimals(floatStr : string) : number
    {
    let i : number = 0;
    while (i < floatStr.length)
        {
        const cc = floatStr.charCodeAt(i);
        if (!(CC_0 <= cc && cc <= CC_9)) break;
        i++;
        }
    if (i >= floatStr.length) return 0;
    const cc : number = floatStr.charCodeAt(i);
    if (cc != CC_DOT && cc != CC_COMMA) return -1;
    i++;
    let start : number = i;
    while (i < floatStr.length)
        {
        const cc = floatStr.charCodeAt(i);
        if (!(CC_0 <= cc && cc <= CC_9)) break;
        i++;
        }
    return i >= floatStr.length ? i - start : -1;
    }

export function validateAndSatoshizeFloatStr(floatStr : string, decimals : number) : string
    {
    const len = floatStr.length;
    let dotIndex : number = -1;
    for (let i = 0; i < len; i++)
        {
        const cc = floatStr.charCodeAt(i);
        if (cc == CC_DOT || cc == CC_COMMA)
            {
            if (dotIndex >= 0)
                return "";
            else
                dotIndex = i;
            }
        else if (!(CC_0 <= cc && cc <= CC_9))
            return "";
        }
    const zeros : string = "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
    if (dotIndex < 0)
        return floatStr + zeros.substring(0, decimals);
    else
        {
        const decimalsFound : number = len - (dotIndex + 1);
        if (decimalsFound == 0)
            return floatStr.substring(0, dotIndex) + zeros.substring(0, decimals);
        else if (decimalsFound > decimals)
            return floatStr.substring(0, dotIndex) + floatStr.substring(dotIndex + 1, dotIndex + 1 + decimals);
        else if (decimalsFound < decimals)
            return floatStr.substring(0, dotIndex) + floatStr.substring(dotIndex + 1) + zeros.substring(0, decimals - decimalsFound);
        else
            return floatStr.substring(0, dotIndex) + floatStr.substring(dotIndex + 1);
        }
    }

export function validateIntStr(intStr : string, mustBeNonZero : boolean) : boolean
    {
    const len = intStr.length;
    if (!len) return false;
    let nonZero : boolean = false;
    for (let i = 0; i < len; i++)
        {
        const cc = intStr.charCodeAt(i);
        if (CC_1 <= cc && cc <= CC_9)
            nonZero = true;
        else if (cc != CC_0)
            return false;
        }
    return mustBeNonZero ? nonZero : true;
    }
