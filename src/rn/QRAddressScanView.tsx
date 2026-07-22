import React, { useEffect, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { Camera, useCameraDevice, useCameraFormat, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import { IconButton, TouchableRipple } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { MC } from "../mc";
import { useCommonStyles, InvalidMessage, SimpleButtonPair, TitleBar } from "./common";
import { useThemeColors } from "./theme";
import { WALLET_SCREENS } from "./WalletView";



const TARGET_ERRORS : string[] =
    [
    "That QR code is not a valid address.",
    "That QR code is not a valid address."
    ];

const TARGET_TITLES : string[] =
    [
    "Scan Address QR Code",
    "Scan Address QR Code"
    ];

export enum QR_SCANNER_TARGETS
    {
    metrixAddress   = 0,
    ethereumAddress = 1
    };

export type QRAddressScanViewSerializableProps =
    {
    target       : QR_SCANNER_TARGETS;
    returnScreen : WALLET_SCREENS;
    };

export type QRAddressScanViewProps = QRAddressScanViewSerializableProps &
    {
    onBurgerPressed  : () => any;
    onAddressScanned : (addr : string) => any;
    };

export function QRAddressScanView(props : QRAddressScanViewProps) : JSX.Element
    {
    const walletNavigation = useNavigation<StackNavigationProp<any>>();
    const colors = useThemeColors();
    const commonStyles = useCommonStyles();
    const [ torchOn, setTorchOn ] = useState<boolean>(false);
    const [ errorMessage, setErrorMessage ] = useState<string>("");
    // CameraX (which VisionCamera is built on) binds its capture session against the actual
    // measured size of the native preview surface. If that binding happens before React Native's
    // layout pass has given the surface a real (non-zero) size, the session can either time out
    // (session/invalid-output-configuration) or silently deliver 0 frames while the sensor
    // captures fine underneath (blank/white screen) -- both of which we hit on-device. Gating
    // Camera's mount on a real onLayout avoids binding against an unmeasured surface.
    const [ cameraContainerReady, setCameraContainerReady ] = useState<boolean>(false);

    function onCameraContainerLayout(event : LayoutChangeEvent) : void
        {
        const { width, height } = event.nativeEvent.layout;
        if (width > 0 && height > 0 && !cameraContainerReady) setCameraContainerReady(true);
        }
    const device = useCameraDevice('back');
    // Without an explicit format, VisionCamera negotiates the device's default (often
    // highest-resolution) format, and on some hardware -- notably several Samsung models --
    // configuring the camera session at that resolution doesn't complete within the library's
    // 5s timeout, crashing with "session/invalid-output-configuration". A QR scanner never
    // needs more than ~720p, so constrain the format to something every camera HAL can
    // configure quickly.
    const format = useCameraFormat(device, [ { videoResolution: { width: 1280, height: 720 } }, { fps: 30 } ]);
    const { hasPermission, requestPermission } = useCameraPermission();

    useEffect(() =>
        {
        if (!hasPermission) requestPermission();
        },
        [ hasPermission ]);

    function onRead(data : string) : void
        {
        const addr : string = massageAddress(data);
        if (addr.length)
            {
            props.onAddressScanned(addr);
            walletNavigation.navigate(props.returnScreen);
            }
        else
            setErrorMessage(TARGET_ERRORS[props.target]);
        }

    const codeScanner = useCodeScanner(
        {
        codeTypes: [ 'qr' ],
        onCodeScanned: (codes) =>
            {
            const value : string | undefined = codes[0]?.value;
            if (value) onRead(value);
            }
        });

    function massageAddress(addr : string) : string
        {
        if (addr.toLowerCase().startsWith("metrix:")) addr = addr.substring(7);
        switch (props.target)
            {
            case QR_SCANNER_TARGETS.ethereumAddress:
                if (addr.startsWith("0x")) addr = addr.substring(2);
                return MC.validateEvmAddress(addr) ? addr : "";
            case QR_SCANNER_TARGETS.metrixAddress:
                return MC.validateMrxAddress(addr) ? addr : "";
            default:
                return "";
            }
        }

    function onRescan() : void
        {
        setErrorMessage("");
        }

    function onCancel() : void
        {
        walletNavigation.navigate(props.returnScreen);
        }

    function renderErrorMessage() : JSX.Element
        {
        return (
            <View style={ commonStyles.containingView }>
                <TitleBar title={ TARGET_TITLES[props.target] } onBurgerPressed={ props.onBurgerPressed }/>
                <View style={ commonStyles.horizontalBar }/>
                <View style={ commonStyles.squeezed }>
                    <View style={{ height: 48 }}/>
                    <InvalidMessage text={ errorMessage }/>
                    <View style={{ height: 48 }}/>
                    <SimpleButtonPair left={{ text: "Cancel", onPress: onCancel }} right={{ text: "Scan More", onPress: onRescan }}/>
                </View>
            </View>
            );
        }

    function renderScannerFooter() : JSX.Element
        {
        function renderTorchButton(buttonTorchOn : boolean, iconName : string) : JSX.Element
            {
            const onPress = () : void => { if (torchOn != buttonTorchOn) setTorchOn(buttonTorchOn); };
            const color : string = torchOn == buttonTorchOn ? colors.green : colors.dullGreen;
            return (<IconButton style={ commonStyles.icon } iconColor={ color } size={ 24 } icon={ iconName } onPress={ onPress }/>);
            }

        return (
            <View style={{ ...commonStyles.rowContainer, marginBottom: 24 }}>
                <View style={{ width: 24 }}/>
                {/* Built from primitives rather than react-native-paper's Button: see the note on
                    SimpleButton in common.tsx for why (Surface/elevation border-rendering bug). */}
                <View style={{ borderColor: colors.green, borderWidth: 1, borderRadius: 20, overflow: "hidden" }}>
                    <TouchableRipple rippleColor={ colors.purpleRipple } onPress={ onCancel }>
                        <View style={{ paddingVertical: 9, paddingHorizontal: 16 }}>
                            <Text style={{ color: colors.green }}>Cancel</Text>
                        </View>
                    </TouchableRipple>
                </View>
                <View style={{ flex: 1 }}/>
                { renderTorchButton(false, "flash-off") }
                <View style={{ width: 12 }}/>
                { renderTorchButton(true, "flashlight") }
                <View style={{ width: 24 }}/>
            </View>
            );
        }

    function renderQRSanner() : JSX.Element
        {
        return (
            <View style={ commonStyles.containingView }>
                <TitleBar title={ TARGET_TITLES[props.target] } onBurgerPressed={ props.onBurgerPressed }/>
                <View style={ commonStyles.horizontalBar }/>
                <View style={{ height: 24 }}/>
                <View style={{ flex: 1, backgroundColor: colors.white }} onLayout={ onCameraContainerLayout }>
                    { device != null && hasPermission && cameraContainerReady
                        ? (
                            <Camera
                                style={ StyleSheet.absoluteFill }
                                device={ device }
                                format={ format }
                                // The default ('native') pixel format can silently stall the
                                // frame pipeline -- camera session opens fine, but 0 frames ever
                                // reach the preview or the code scanner -- when a preview stream
                                // and the code scanner's analysis stream are bound together on
                                // some non-Qualcomm chipsets (observed on MediaTek). Forcing YUV
                                // avoids that stall.
                                pixelFormat="yuv"
                                fps={ 30 }
                                isActive={ true }
                                torch={ torchOn ? 'on' : 'off' }
                                codeScanner={ codeScanner }
                                onError={ (e) : void => setErrorMessage(`Camera error: ${ e.message }`) }
                                />
                            )
                        : null
                        }
                    { renderScannerFooter() }
                </View>
            </View>
            );
        }

    return errorMessage.length ? renderErrorMessage() : renderQRSanner();
    }



// It seemed like it might be worth keeping these notes.
//   mYbETUoAf4ZZZJoNKfL9K8T8mcUo52mDNB
//   6D59624554556F4166345A5A5A4A6F4E4B664C394B3854386D63556F35326D444E42
//4226d59624554556f4166345a5a5a4a6f4e4b664c394b3854386d63556f35326d444e420ec11ec11ec11ec11ec11ec11ec11ec11ec11ec
//const x = {"bounds":{"width":1472,"height":1104,"origin":[{"y":"215.5","x":"889.5"},{"y":"213.5","x":"836.5"},{"y":"162.5","x":"838.5"},{"y":"171.0","x":"884.0"}]},"type":"QR_CODE","rawData":"4226d59624554556f4166345a5a5a4a6f4e4b664c394b3854386d63556f35326d444e420ec11ec11ec11ec11ec11ec11ec11ec11ec11ec","data":"mYbETUoAf4ZZZJoNKfL9K8T8mcUo52mDNB","target":2277};
