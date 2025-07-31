import React, {useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Animated } from "react-native";
import Svg, { G, Circle } from "react-native-svg";
import { AntDesign } from '@expo/vector-icons';

export default NextButton = () => {

    const size = 84;
    const strokeWidth = 2;
    const center = size / 2;
    const radius = size / 2 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;

    const progressAnimation = useRef(new Animated.Value(0)).current;

    return (
        <>
            <View style={styles.container}>
                <Svg width={size} height={size}>
                    <G rotation="-90" origin={center}>
                        <Circle stroke="#E6E7E8" cx={center} cy={center} r={radius} strokeWidth={strokeWidth} />

                        <Circle stroke="#329de4ff" cx={center} cy={center} r={radius} strokeWidth={strokeWidth}
                            strokeDasharray={circumference} strokeDashoffset={circumference - (circumference * 60) / 100} />
                    </G>
                </Svg>
                <TouchableOpacity style={styles.button} activeOpacity={0.6}>
                    <AntDesign name="arrowright" size={28} color="#fff"/>
                </TouchableOpacity>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    button:{
        position: 'absolute',
        backgroundColor: '#329de4ff',
        borderRadius: 100,
        padding: 20,
    }
})