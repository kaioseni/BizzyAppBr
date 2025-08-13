import React from "react";
import { View, StyleSheet, Animated, useWindowDimensions } from "react-native";

export default Paginator = ({ data, scrollx }) => {
  const { width } = useWindowDimensions();


  const dotHeight = width * 0.025; 
  const dotBorderRadius = dotHeight / 2;
  const dotMarginHorizontal = width * 0.015; 

  return (
    <View style={{ flexDirection: "row", height: dotHeight * 3, justifyContent: 'center' }}>
      {data.map((_, i) => {
        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

        const dotWidth = scrollx.interpolate({
          inputRange,
          outputRange: [dotHeight, dotHeight * 2, dotHeight],
          extrapolate: "clamp",
        });

        const opacity = scrollx.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: "clamp",
        });

        return (
          <Animated.View
            key={i.toString()}
            style={[
              styles.dot,
              {
                width: dotWidth,
                height: dotHeight,
                borderRadius: dotBorderRadius,
                marginHorizontal: dotMarginHorizontal,
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  dot: {
    backgroundColor: "#329de4ff",
  },
});
