import styled from "@emotion/styled";
import { Component } from "react";
import DownloadIcon from "@mui/icons-material/Download";
import LaunchIcon from "@mui/icons-material/Launch";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
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
  color: var(--light);
  background-color: var(--sec1);
  padding: 9px;
  border-radius: 3px;
  display: flex;
  justify-content: space-between;
  h3 {
    // margin: 16px;
    // font-size: 1em;
  }
  .del-icon {
    color: coral;
    cursor: pointer;
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

class Converted extends Component {
  constructor(props) {
    super(props);
    this.state = {
      copied: false,
    };
  }

  copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      this.setState({
        copied: true,
      });
      alert("copied");
    });
  };
  render() {
    if (!this.props) return;
    const handleDelete = () => {
      if (!this.props) return;

      // console.log(this.props.infoHash);
      fetch(`/torrents/${this.props.infoHash}`, {
        method: "DELETE",
      }).then(() => {
        this.props.refreshTorrents();
      });
    };
    return (
      <>
        <Container>
          <Convert>
            <FileTitle>
              <h3>
                {this.props.name.length > 15
                  ? this.props.name.slice(0, 11) +
                    "......." +
                    this.props.name.slice(-4)
                  : this.props.name}
              </h3>
              {this.props.allowDelete === true ? (
                <DeleteForeverIcon
                  className="del-icon"
                  onClick={handleDelete}
                />
              ) : (
                ""
              )}
            </FileTitle>

            <Files>
              <ul>
                {this.props.files ? (
                  this.props.files.map((file_, index) => {
                    if (!file_ || !file_.length) return;
                    return (
                      <li key={index}>
                        <span>
                          {file_.name.slice(0, 14) +
                            "..........." +
                            file_.name.slice(-4)}
                        </span>
                        <a
                          href={`${file_.link}`}
                          target="_blank"
                          // download={file_.name}
                        >
                          <span>{formatBytes(file_.length)}</span>
                          <LaunchIcon />
                        </a>
                        <ContentCopyIcon
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            this.copyToClipboard(
                              window.location.href + file_.link
                            )
                          }
                        />
                      </li>
                    );
                  })
                ) : (
                  <div>...</div>
                )}
              </ul>
            </Files>
          </Convert>
        </Container>
      </>
    );
  }
}
// export class Downloads extends Component {
//   render() {
//     return (
//       <>
//         <Container forceColor>
//           <div>
//             <h2 className="header">Downloading</h2>
//           </div>
//           <Downloading>
//             <Files>
//               <ul>
//                 <li>
//                   <span>sintel aee4.mp4</span>
//                   <a href="#">
//                     <span>123mb</span>
//                     <DeleteForeverIcon />
//                   </a>
//                 </li>
//               </ul>
//             </Files>
//           </Downloading>
//         </Container>
//       </>
//     );
//   }
// }
export default Converted;
