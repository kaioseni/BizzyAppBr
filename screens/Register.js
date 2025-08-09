import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, View } from 'react-native';

export default function Register() {

    const navigation = useNavigation();

    return (
        <>
            <View style={styles.container}>
                <Text>Cadastre-se Aqui</Text>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }
});