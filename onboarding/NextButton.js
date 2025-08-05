import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Animated } from "react-native";
import Svg, { G, Circle } from "react-native-svg";
import { AntDesign } from '@expo/vector-icons';

// Cria um componente Circle animável
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const NextButton = ({ percentage, scrollTo }) => {
    const size = 84;
    const strokeWidth = 4;
    const center = size / 2;
    const radius = size / 2 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;

    const progressAnimation = useRef(new Animated.Value(0)).current;

    const animateProgress = (toValue) => {
        Animated.timing(progressAnimation, {
            toValue,
            duration: 250,
            useNativeDriver: false, 
        }).start();
    };

    useEffect(() => {
        animateProgress(percentage);
    }, [percentage]);

    const strokeDashoffset = progressAnimation.interpolate({
        inputRange: [0, 100],
        outputRange: [circumference, 0],
    });

    return (
        <View style={styles.container}>
            <Svg width={size} height={size}>
                <G rotation="-90" origin={`${center}, ${center}`}>
                    <Circle
                        stroke="#E6E7E8"
                        cx={center}
                        cy={center}
                        r={radius}
                        strokeWidth={strokeWidth}
                    />
                    <AnimatedCircle
                        stroke="#329de4ff"
                        cx={center}
                        cy={center}
                        r={radius}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                    />
                </G>
            </Svg>
            <TouchableOpacity onPress={scrollTo} style={styles.button} activeOpacity={0.6}>
                <AntDesign name="arrowright" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

export default NextButton;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        position: 'absolute',
        backgroundColor: '#329de4ff',
        borderRadius: 100,
        padding: 20,
    },
});
