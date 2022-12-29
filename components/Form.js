import styled from "@emotion/styled";
import { Component, lazy, Suspense } from "react";
import { paste } from "../lib/functions";
// import { Downloads, Converted } from "./Converted";
import { Loading } from "./Loading";
import { Error } from "./Error";

const Converted = lazy(() => import("./Converted"));

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
const OutTitle = styled.div`
  padding: 12px;
  background: var(--sec);
  color: white;
`;
class Form extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pasteText: "",
      url: "",
      torrent: [null],
      torrents: [],
      submitting: null,
      fetching: false,
      errorOccured: false,
      errMsg: "",
    };
  }

  render() {
    if (typeof window !== "undefined") {
      window.onload = () => {
        this.setState({ torrent: null });
      };
    }
    return (
      <>
        {this.state.submitting ? (
          <Loading removeLoading={this.removeLoading} />
        ) : (
          ""
        )}
        {this.state.errorOccured ? (
          <Error message={this.state.errMsg} removeErr={this.removeErr} />
        ) : (
          ""
        )}
        <Container className="centered">
          <form onSubmit={this.onSubmit}>
            <input
              type="url"
              name="file"
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
        <OutTitle className="converted-title">Converted Files</OutTitle>
        <Suspense fallback={<div>Loading...</div>}>
          {this.state.torrents.map((item, index) => {
            console.log(item);
            return (
              <Converted
                id={index}
                name={item.name}
                infoHash={item.infoHash}
                files={item.files}
              />
            );
          })}
        </Suspense>
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
    var url = e.target.file;
    let bodyContent = JSON.stringify({
      link: url.value,
    });
    let headersList = {
      Accept: "*/*",
      "Content-Type": "application/json",
    };
    fetch(`/torrents/`, {
      method: "POST",
      body: bodyContent,
      headers: headersList,
    })
      .then((response) => {
        // console.log(response);
        if (response.errored) {
          this.setState((state) => ({
            errorOccured: false,
            submitting: false,
            errMsg: "invalid torrent",
          }));
        }

        return response.json();
      })

      .then((data) => {
        this.loadTorrent(data.infoHash);
      })
      .catch((err) => {
        this.setState((state) => ({
          errorOccured: true,
          errMsg: "Couldn't convert file\n" + err,
        }));
      });
  };

  //////////Helper  Functions

  removeErr = () => {
    this.setState({ errorOccured: false });
  };
  removeLoading = () => {
    this.setState({ submitting: false });
  };

  async loadTorrent(hash) {
    let headersList = {
      Accept: "*/*",
    };

    let response = await fetch(`/torrents/${hash}`, {
      method: "GET",
      headers: headersList,
    });

    let data = await response.json();
    // console.log({ data });
    this.setState((state) => ({
      torrents: state.torrents.concat(data).reverse(),
      submitting: false,
    }));
  }
}
export default Form;
