/**
 *
 * @author Holy Mark.
 * @file Main GUI.
 */
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
      allTorrents: null,
      submitting: null,
      fetching: false,
      errorOccured: false,
      errMsg: "",
    };

    this.refreshTorrents = this.refreshTorrents.bind(this);
  }
  async componentDidMount() {
    let response = await fetch(`/torrents/`);

    let torrentsData = await response.json();
    // console.log(torrentsData);
    this.setState({ allTorrents: torrentsData });
  }

  render() {
    if (typeof window !== "undefined") {
      window.onload = () => {
        this.setState({ torrent: null });
      };
    }
    const { allTorrents } = this.state;

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
        {this.state.torrents.length > 0 ? (
          <OutTitle className="converted-title">Converted Files</OutTitle>
        ) : (
          ""
        )}
        <Suspense fallback={<div>Loading...</div>}>
          {this.state.torrents.map((item, index) => {
            // console.log(item);
            return (
              <Converted
                key={index}
                name={item.name}
                infoHash={item.infoHash}
                files={item.files}
                refreshTorrents={this.refreshTorrents}
                allowDelete={false}
              />
            );
          })}
        </Suspense>
        <br />
        <hr />
        <br />

        <div>
          {allTorrents ? (
            <OutTitle className="converted-title">All Converted Files</OutTitle>
          ) : (
            ""
          )}
          {allTorrents ? (
            allTorrents
              .map((torrent_, index) => {
                // console.log(torrent_);
                return torrent_ ? (
                  <>
                    <Converted
                      key={index}
                      name={torrent_.name}
                      infoHash={torrent_.infoHash}
                      files={torrent_.files}
                      refreshTorrents={this.refreshTorrents}
                      allowDelete={true}
                    />
                  </>
                ) : (
                  ""
                );
              })
              .reverse()
          ) : (
            <div>loading....</div>
          )}
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
        // this.setState({ errMsg: "Couldn't paste text" });
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
        url.value = "";
      })
      .catch((err) => {
        this.setState((state) => ({
          errorOccured: true,
          errMsg: "Couldn't convert file\n" + err,
        }));
      });
  };

  //////////  Helper  Functions

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
  refreshTorrents() {
    fetch("/torrents/")
      .then((res) => res.json())
      .then((torrentsData) => {
        // console.log(torrentsData);
        return this.setState({ allTorrents: torrentsData });
      })
      .catch((e) => {
        console.log(e);
      });
  }
}
export default Form;
