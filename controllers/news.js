import fetch from "node-fetch";

export const getNewsData = async (req, res) => {
  const { section, pageToken } = req.query;

  try {
    const date = getDateXDaysAgo(35);

    const result = await fetch(
      `https://youtube.googleapis.com/youtube/v3/search?part=snippet&${
        Number(section) !== 0 ? `pageToken=${pageToken}&` : ``
      }q=7vswild&publishedAfter=${date}&type=video&key=${
        process.env.YOUTUBE_API_KEY
      }`
    );

    const resultJSON = await result?.json();

    const data = resultJSON?.items?.map((item) => item?.id?.videoId);

    res.status(200).json({
      data,
      pageToken: resultJSON?.nextPageToken,
      total: resultJSON?.pageInfo?.totalResults,
    });
  } catch (error) {
    res.status(500).json({ message: "Bitte versuche es später erneut." });
  }
};

function getDateXDaysAgo(numOfDays, date = new Date()) {
  const daysAgo = new Date(date.getTime());

  daysAgo.setDate(date.getDate() - numOfDays);

  return new Date(daysAgo).toISOString();
}
