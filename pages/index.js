import { Component } from "react";
import Banner from "../components/Barner";
import Form from "../components/Form";
import Head from "next/head";

class Home extends Component {
  render() {
    return (
      <>
        <Head>
          <title>TorrentedApp</title>
        </Head>
        <Banner />
        <Form />
      </>
    );
  }
}
export default Home;
