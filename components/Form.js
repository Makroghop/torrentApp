import styled from "@emotion/styled";
import { Component } from "react";
import { paste } from "../lib/functions";
import { Downloads, Converted } from "./Converted";
import { Loading } from "./Loading";
import io from "socket.io-client";
import { Error } from "./Error";
const socket = io();

const Container = styled.div`
  form {
    width: 100%;
    padding: 20px 12px;
    input {
      width: 100%;
      padding: 12px 20px;
      margin: 8px 0;
      display: inline-block;
      border: 1px solid var(--prim);
      color: var(--prim);
      border-radius: 4px;
      outline: none;
      font-size: 18px;
    }
  }
`;

const ActionButton = styled.button`
  padding: 12px 20px;
  margin: 8px 0;
  display: inline-block;
  border: 1px solid var(--light);
  border-radius: 4px;
  background-color: ${(props) =>
    props.primary ? "var(--prim)" : "var(--sec)"};
  outline: none;
  font-size: 18px;
  color: white;
  margin: 0px 5px;
`;

class Form extends Component {
  constructor(props) {
    super(props);
    this.torrentsData = [];
    this.state = {
      pasteText: "",
      url: "",
      torrent: null,
      torrents: this.torrentsData,
      submitting: null,
      fetching: false,
      errorOccured: false,
      errMsg: "",
    };
    this.prependTorrentsData = this.prependTorrentsData.bind(this);
  }

  render() {
    this.checkHash();
    this.onBadTorrent();
    this.onTorrent();

    if (typeof window !== "undefined") {
      window.onload = () => {
        this.setState({ torrent: null });
      };
    }

    return (
      <>
        {this.state.submitting ? <Loading /> : ""}
        {this.state.errorOccured ? (
          <Error message={this.state.errMsg} removeErr={this.removeErr} />
        ) : (
          ""
        )}
        <Container className="centered">
          <form onSubmit={this.onSubmit}>
            <input
              type="url"
              name="url"
              placeholder="torrent file url"
              defaultValue={this.state?.pasteText}
              required
            />
            <div className="buttons centered">
              <ActionButton type="button" onClick={this.handlePaste}>
                Paste
              </ActionButton>
              <ActionButton type="submit" primary={true}>
                Convert
              </ActionButton>
            </div>
          </form>
        </Container>
        <div>
          {this.state.torrent ? this.torrentsData : ""}
          {/* <Downloads /> */}
        </div>
      </>
    );
  }

  ////// Event Listeners
  handlePaste = () => {
    navigator.clipboard
      .readText()
      .then((text) => {
        this.setState({ pasteText: text });
      })
      .catch((err) => {
        this.setState({ errMsg: "Couldn't paste text" });
      });
  };
  onSubmit = (e) => {
    e.preventDefault();
    this.setState({ submitting: true });
    this.state.url = e.target.url.value;
    this.setState({ url: e.target.url.value });
    this.add(e.target.url.value);
    this.prependTorrentsData();
  };

  //////////Helper  Functions

  prependTorrentsData() {
    if (this.state.torrent !== null) {
      this.torrentsData.unshift(
        <Converted
          name={this.state.torrent.name}
          file={this.state.torrent.files}
        />
      );
      this.setState({ torrents: this.torrentsData });
    }
  }

  removeErr = () => {
    this.setState({ errorOccured: false });
  };

  checkHash() {
    var hash = globalThis.window?.location.hash.substring(1);
    if (hash) {
      setTimeout(() => {
        if (this.state.torrent && this.state.torrent.url === hash) return;
        // if (this.state.torrent) scope.back();
        this.setState({ url: hash });
        this.add();
      }, 500);
    }
  }
  ///// Socket functions

  add() {
    this.setState({ submitting: true });

    let hash = globalThis.window?.location.hash;
    // hash = "#" + this.state.url;
    socket.emit("add-torrent", this.state.url);
    // if (this.state.torrent !== null) {
    // }
  }
  back() {
    socket.emit("remove-torrent");
    let hash = globalThis.window?.location.hash;
    hash = "";
    this.setState({ torrent: null });
    this.setState({ submitting: null });
  }
  delCb() {
    socket.emit("remove-torrent");
    let hash = globalThis.window?.location.hash;
    hash = "";
    this.setState({ torrent: null });
    this.setState({ submitting: null });
  }
  onTorrent() {
    socket.on("torrent", (torrent) => {
      this.setState({ errorOccured: false });

      this.setState({ url: "" });
      this.setState({ torrent });
      this.setState({ submitting: false });
    });
  }

  onBadTorrent() {
    socket.on("bad-torrent", () => {
      setTimeout(() => {
        this.setState({ errorOccured: true });

        this.setState({ errMsg: "error: invalid Torrent" });
      }, 2000);
      this.setState({ submitting: false });
    });
  }
}
export default Form;
