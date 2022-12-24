import styled from "@emotion/styled";
import { Component } from "react";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { formatBytes } from "../lib/functions";

const Container = styled.div`
  div.converted {
    // margin: 16px;
    // padding: 13px;
    color: white;
    background: #f58a8a;
    // font-size: 1em;
  }
`;
const Convert = styled.div`
  margin: 8px;
`;
const FileTitle = styled.div`
  h3 {
    color: var(--light);
    background-color: var(--sec1);
    // margin: 16px;
    padding: 9px;
    border-radius: 3px;
    // font-size: 1em;
  }
`;
const Files = styled.div`
  ul {
    li {
      color: #282631;
      background: #aabcff;
      border-radius: 4px;
      font-weight: bolder;
      font-size: 15px;
      padding: 7px;
      margin-bottom: 1px;

      a {
        color: inherit;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 17px;
      }
    }
  }
`;

const Downloading = styled.div`
  margin: 3px 16px;
`;

export class Converted extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <>
        <Container>
          <Convert>
            <FileTitle>
              <h3>{this.props.name}</h3>
            </FileTitle>

            <Files>
              <ul>
                {this.props.files.map((file_, index) => {
                  return (
                    <li key={index}>
                      <span>{file_.name}</span>
                      <a
                        href={`/download/?torrent=${this.props.url}&filename=${file_.name}`}
                        target="_blank"
                        download={file_.name}
                      >
                        <span>{formatBytes(file_.length)}</span>
                        <DownloadIcon />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </Files>
          </Convert>
        </Container>
      </>
    );
  }
}
export class Downloads extends Component {
  render() {
    return (
      <>
        <Container forceColor>
          <div>
            <h2 className="header">Downloading</h2>
          </div>
          <Downloading>
            <Files>
              <ul>
                <li>
                  <span>sintel aee4.mp4</span>
                  <a href="#">
                    <span>123mb</span>
                    <DeleteForeverIcon />
                  </a>
                </li>
              </ul>
            </Files>
          </Downloading>
        </Container>
      </>
    );
  }
}
