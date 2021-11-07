import fetch from 'node-fetch';
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GH_TOKEN,
});

const apiKey = process.env.NASA_TOKEN;

fetch(`https://api.nasa.gov/EPIC/api/natural?api_key=${apiKey}`)
  .then((res) => res.json())
  .then(async(d) => {
    const year = d[0].identifier.slice(0, 4);
    const month = d[0].identifier.slice(4, 6);
    const day = d[0].identifier.slice(6, 8);
    const image = `https://api.nasa.gov/EPIC/archive/natural/${year}/${month}/${day}/png/epic_1b_20211105002712.png?api_key=${apiKey}`
    
    const readme = await octokit.rest.repos.getReadme({
      owner: "tinvv",
      repo: "Earth",
    });
    const content = Buffer.from(
      readme.data.content,
      "base64"
    ).toString();
    const data = content.split("\n");

    const start_line = data.indexOf("<!-- Earth Image Update -->");
    const end_line = data.indexOf("<!-- /Earth Image Update -->");

    if (start_line === -1 && end_line === -1) {
      console.log("Error: Could not find start/end line syntax");
    }

    data.splice(
      start_line + 1,
      end_line - start_line - 1,
      `![earth](${image})`
    )

    const modify = data.join("\n");
    octokit.rest.repos.createOrUpdateFileContents({
      owner: "tinvv",
      repo: "Earth",
      path: "README.md",
      branch: "main",
      message: "Update README.md",
      sha: readme.data.sha,
      content: Buffer.from(modify).toString("base64"),
      committer: {
        name: "Tin's bot",
        email: "Toddsbin@users.noreply.github.com",
      },
    });
  })