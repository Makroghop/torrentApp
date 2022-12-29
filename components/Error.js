import styled from "@emotion/styled";
import { Cancel } from "@mui/icons-material";
import Image from "next/image";
import { Component } from "react";

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  opacity: 0.9;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
  background-color: white;
  color: red;
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

export class Error extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <>
        <Container>
          <div className="cancel" onClick={this.props.removeErr}>
            <Cancel className="cancel-icon" />
          </div>
          <strong>{this.props.message}</strong>
        </Container>
      </>
    );
  }
}
