import styled from "@emotion/styled";
import { Component } from "react";

const Container = styled.div`
  min-height: 40vh;
  h1 {
    text-align: center;
    font-family: "Courgette", sans-serif;
    color: var(--prim);
    font-size: 3em;
  }
`;
class Banner extends Component {
  render() {
    return (
      <>
        <Container className="centered">
          <h1>Online Torrent Converter</h1>
        </Container>
      </>
    );
  }
}
export default Banner;
