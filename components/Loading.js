import { Cancel } from "@mui/icons-material";
import styled from "@emotion/styled";
import Image from "next/image";
import { Component } from "react";

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  opacity: 0.7;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  z-index: 1;
  background-color: white;
  font-size: 20px;
  .cancel {
    position: absolute;
    top: 20%;
    right: 7%;
    .cancel-icon {
      font-size: 50px;
      font-weight: bolder;
      cursor: pointer;
    }
  }
`;

export class Loading extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <>
        <Container>
          <div className="cancel" onClick={this.props.removeLoading}>
            <Cancel className="cancel-icon" />
          </div>
          <Image src="/loading.gif" alt="loading" width={360} height={300} />
          <b>loading.....</b>
        </Container>
      </>
    );
  }
}
