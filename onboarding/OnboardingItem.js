import React from "react";
import { View, Text, StyleSheet, Image, useWindowDimensions } from "react-native";

export default OnboardingItem = ({ item }) => {
    const { width, height } = useWindowDimensions();

    return (
        <View style={[styles.container, { width }]}>
            <Image
                source={item.image}
                style={[
                    styles.image,
                    {
                        width: width * 0.8, 
                        height: height * 0.4, 
                    },
                ]}
                resizeMode="contain"
            />

            <View style={{ flex: 0.3, paddingHorizontal: width * 0.1 }}>
                <Text style={[styles.title, { fontSize: width * 0.07 }]}>
                    {item.title}
                </Text>
                <Text style={[styles.description, { fontSize: width * 0.045 }]}>
                    {item.description}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    image: {
        flex: 0.4,
        justifyContent: "center",
    },
    title: {
        fontWeight: "900",
        marginBottom: 10,
        color: "#329de4ff",
        textAlign: "center",
    },
    description: {
        fontWeight: "300",
        color: "#62656b",
        textAlign: "center",
    },
});
