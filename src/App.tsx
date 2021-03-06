import React, { useEffect, createContext, useState } from "react";

import RoomView from "./components/RoomView";
import ChatView from "./components/ChatView";
import InputView from "./components/InputView";
import { connect, getLoginInfo, checkIsRegistered } from "./networking";
import reducer, { State, defaultState } from "./reducer";
import { AuthenticateAction, Action, IsRegisteredAction } from "./Actions";
import ProfileView from "./components/ProfileView";
import { useReducerWithThunk } from "./useReducerWithThunk";
import config from "./config";
import MediaChatView from "./components/MediaChatView";
import ProfileEditView from "./components/ProfileEditView";
import RoomListView from "./components/RoomListView";
import { IconContext } from "react-icons/lib";

export const DispatchContext = createContext(null);
export const UserMapContext = createContext(null);

const App = () => {
  const [state, dispatch] = useReducerWithThunk<Action, State>(
    reducer,
    defaultState
  );

  useEffect(() => {
    // TODO: This logic is gnarly enough I'd love to abstract it somewhere
    const login = getLoginInfo().then((login) => {
      let userId, name;
      if (!login) {
        // This should really be its own action distinct from logging in
        dispatch(AuthenticateAction(undefined, undefined));
      } else {
        userId = login.user_claims[0].val;
        name = login.user_id;
        checkIsRegistered().then((registered) => {
          dispatch(AuthenticateAction(userId, name));
          if (registered) {
            dispatch(IsRegisteredAction());
            connect(userId, dispatch);
          }
        });
      }
    });
  }, []);

  const profile = state.visibleProfile ? (
    <ProfileView user={state.visibleProfile} />
  ) : (
    ""
  );

  if (!state.checkedAuthentication) {
    return <div />;
  }

  if (state.checkedAuthentication && !state.authenticated) {
    return (
      <a
        href={`${
          config.SERVER_HOSTNAME
        }/.auth/login/twitter?post_login_redirect_url=${encodeURIComponent(
          window.location.href
        )}`}
      >
        Log In
      </a>
    );
  }

  if (state.showProfileEditScreen || !state.hasRegistered) {
    // Fetching the handle like this is silly.
    return (
      <ProfileEditView
        isFTUE={!state.hasRegistered}
        defaultHandle={state.userMap[state.userId].username}
        user={state.profileData}
      />
    );
  }

  let videoChatView;
  if (state.localMediaStreamId) {
    videoChatView = (
      <MediaChatView
        localMediaStreamId={state.localMediaStreamId}
        peerIds={state.otherMediaStreamPeerIds}
        mediaDevices={state.mediaDevices}
        videoDeviceId={state.currentVideoDeviceId}
        audioDeviceId={state.currentAudioDeviceId}
        speakingPeerIds={state.speakingPeerIds}
      />
    );
  }

  console.log(state.roomId, state.roomData, state.roomData[state.roomId]);
  return (
    <IconContext.Provider value={{ style: { verticalAlign: "middle" } }}>
      <DispatchContext.Provider value={dispatch}>
        <UserMapContext.Provider
          value={{ userMap: state.userMap, myId: state.userId }}
        >
          <div id="main">
            <RoomListView
              rooms={Object.values(state.roomData)}
              username={state.userMap[state.userId].username}
            />
            {videoChatView}
            <RoomView
              room={state.roomData[state.roomId]}
              userId={state.userId}
            />
            {profile}
            <ChatView messages={state.messages} />
            <InputView prepopulated={state.prepopulatedInput} />
          </div>
        </UserMapContext.Provider>
      </DispatchContext.Provider>
    </IconContext.Provider>
  );
};

export default App;
