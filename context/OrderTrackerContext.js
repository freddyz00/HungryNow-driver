import React, { createContext, useContext, useState } from "react";

const OrderTrackerContext = createContext();

export const OrderTrackerProvider = ({ children }) => {
  const [messagesWithCustomer, setMessagesWithCustomer] = useState([]);
  const [pusher, setPusher] = useState();

  return (
    <OrderTrackerContext.Provider
      value={{
        messagesWithCustomer,
        setMessagesWithCustomer,
        pusher,
        setPusher,
      }}
    >
      {children}
    </OrderTrackerContext.Provider>
  );
};

export const useOrderTracker = () => useContext(OrderTrackerContext);
