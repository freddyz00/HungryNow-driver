import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";

import { GiftedChat, Bubble, Time } from "react-native-gifted-chat";

import { useOrderTracker } from "../context/OrderTrackerContext";

const ChatScreen = ({ route }) => {
  const { messagesWithCustomer, setMessagesWithCustomer, pusher } =
    useOrderTracker();
  const { customer } = route.params;

  let user_rider_channel;

  const onSend = (messages = []) => {
    user_rider_channel = pusher.subscribe(`private-user-rider-${customer.uid}`);
    user_rider_channel.trigger("client-new-message", {
      messages,
    });
    setMessagesWithCustomer(
      GiftedChat.append(
        [...messagesWithCustomer],
        [{ ...messages[0], sent: true }]
      )
    );
  };

  const renderBubble = (props) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          left: { backgroundColor: "grey" },
          right: { backgroundColor: "#fcbf49" },
        }}
        textStyle={{ left: { color: "white" }, right: { color: "black" } }}
        renderTime={renderTime}
        tickStyle={{ color: "black" }}
      />
    );
  };

  const renderTime = (props) => {
    return (
      <Time
        timeTextStyle={{ left: { color: "white" }, right: { color: "black" } }}
        {...props}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <GiftedChat
        messages={messagesWithCustomer}
        user={{ _id: 2, name: "driver" }}
        onSend={onSend}
        renderBubble={renderBubble}
      />
    </View>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
});
