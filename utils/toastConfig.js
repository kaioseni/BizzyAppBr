import { BaseToast } from "react-native-toast-message";

export const getToastConfig = (themeColors) => ({
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: "#329de4",
        borderLeftWidth: 6,
        backgroundColor: themeColors.card,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ color: themeColors.text, fontSize: 15 }}
      text2Style={{ color: themeColors.text, fontSize: 15 }}
    />
  ),
  error: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: "#ff0000ff",
        borderLeftWidth: 6,
        backgroundColor: themeColors.card,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ color: themeColors.text, fontSize: 15 }}
      text2Style={{ color: themeColors.text, fontSize: 15 }}
    />
  ),
});
