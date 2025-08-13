import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, FlatList, Animated, Dimensions, SafeAreaView, TouchableOpacity } from "react-native";
import slides from './slides';
import OnboardingItem from "./OnboardingItem";
import Paginator from "./Paginator";
import NextButton from "./NextButton";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const { height, width } = Dimensions.get("window");

export default Onboarding = () => {
    const navigation = useNavigation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollx = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef(null);

    const viewableItemsChanged = useRef(({ viewableItems }) => {
        setCurrentIndex(viewableItems[0].index);
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const scrollTo = async () => {
        if (currentIndex < slides.length - 1) {
            slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
        } else {
            try {
                await AsyncStorage.setItem('@viewedOnboarding', 'true');
                navigation.replace('LoginScreen');
            } catch (err) {
                console.log('Error @setItem: ', err);
            }
        }
    };

    return (
    <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
            <View style={{ flex: 3 }}>
                <FlatList
                    data={slides}
                    renderItem={({ item }) => <OnboardingItem item={item} />}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    bounces={false}
                    keyExtractor={(item) => item.id}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollx } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={32}
                    onViewableItemsChanged={viewableItemsChanged}
                    viewabilityConfig={viewConfig}
                    ref={slidesRef}
                />
            </View>

            <View style={styles.paginatorContainer}>
                <Paginator data={slides} scrollx={scrollx} />
            </View>

            <View style={styles.bottomContainer}>
                <NextButton
                    scrollTo={scrollTo}
                    percentage={(currentIndex + 1) * (100 / slides.length)}
                    isLast={currentIndex === slides.length - 1}
                />

                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => slidesRef.current.scrollToIndex({ index: slides.length - 1 })}
                >
                    <Text style={styles.skipText}>Pular</Text>
                </TouchableOpacity>
            </View>
        </View>
    </SafeAreaView>
);
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    bottomContainer: {
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        paddingBottom: height * 0.12,
        position: "relative",
    },
    skipButton: {
        position: "absolute",
        right: width * 0.05,
        bottom: height * 0.05,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderWidth: 2,
        borderRadius: 50,
        borderColor: '#000000ff',
        backgroundColor: '#329de4ff'
    },
    skipText: {
        fontSize: width * 0.035,
        fontWeight: "bold",
        color: "#000",
    },
    paginatorContainer: {
        height: height * 0.15,      
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
    },
});
