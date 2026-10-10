const noReferrerPrefixes = [
  "https://static001.geekbang.org/resource/image",
  "https://static001.geekbang.org/resource/avatar",
  "https://static001-test.geekbang.org/resource/image",
  "https://static001.infoq.cn/resource/image",
  "https://static001.geekbang.org/con",
];

document.querySelectorAll("img[src]").forEach((img) => {
  const src = img.getAttribute("src");
  if (src && noReferrerPrefixes.some((prefix) => src.startsWith(prefix))) {
    img.setAttribute("referrerpolicy", "no-referrer");
  }
});
