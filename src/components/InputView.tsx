import React, { useContext, useState, useEffect } from "react";
import { DispatchContext } from "../App";
import { SendMessageAction } from "../Actions";

export default (props: { prepopulated?: string }) => {
  const dispatch = useContext(DispatchContext);
  const [input, setInput] = useState("");

  const handleInputChange = (e) => setInput(e.currentTarget.value);

  const checkEnter = (e) => {
    if (e.key === "Enter") {
      onClick();
    }
  };

  const onClick = () => {
    dispatch(SendMessageAction(input));
    setInput("");
  };

  useEffect(() => {
    console.log("useEffect");
    document.getElementById("chat-input").focus();
    if (props.prepopulated) {
      setInput(props.prepopulated);
    }
  }, [props.prepopulated]);

  return (
    <div id="input">
      <input
        type="text"
        id="chat-input"
        onChange={handleInputChange}
        onKeyPress={checkEnter}
        value={input}
      />
      <button id="send" onClick={onClick}>
        Send
      </button>
    </div>
  );
};
