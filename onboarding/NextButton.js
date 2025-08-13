import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Animated, Text, useWindowDimensions } from "react-native";
import Svg, { G, Circle } from "react-native-svg";
import { AntDesign } from '@expo/vector-icons';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const NextButton = ({ percentage, scrollTo, isLast }) => {
    const { width } = useWindowDimensions();

    const size = width * 0.2;
    const strokeWidth = size * 0.05; 
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
            {!isLast && (
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
            )}

            <TouchableOpacity
                onPress={scrollTo}
                style={[
                    styles.button,
                    isLast && styles.buttonLast,
                    { padding: size * 0.25, borderRadius: isLast ? size * 0.35 : 100 }
                ]}
                activeOpacity={0.6}
            >
                {isLast ? (
                    <Text style={[styles.getStartedText, { fontSize: size * 0.25, color: '#000' }]}>
                        Começar
                    </Text>
                ) : (
                    <AntDesign name="arrowright" size={size * 0.33} color="#fff" />
                )}
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonLast: {
        borderWidth: 2,
        borderColor: '#329de4ff',
    },
    getStartedText: {
        fontWeight: 'bold',
    },
});
