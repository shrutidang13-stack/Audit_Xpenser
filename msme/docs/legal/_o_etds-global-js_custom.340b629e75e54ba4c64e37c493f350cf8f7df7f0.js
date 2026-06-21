window.isSPALoad = false;

Liferay.on('beforeNavigate', function() {
  window.isSPALoad = true;
});

/**
 * Script to Remove "&download=true" from PDF/Documents URL
 */
function removeDownloadAttribute() {
  document.querySelectorAll(".pdf-link-document-viewer-item .item-link").forEach(function(element){
      element.setAttribute("href", element.getAttribute("href").replace("&download=true", ""))
  })
}

/**
 * Script to Play Video on Thumbnail click for Miscellaneous Page
 */
function playVideoOnThumbnailClick() {
  document.querySelectorAll(".miscellaneous-card.video .video-thumbnail").forEach(function (thumbnail) {
    thumbnail.addEventListener("click", () => { 
      thumbnail.classList.add("d-none");
      thumbnail.closest(".miscellaneous-video-wrap")?.querySelector("video")?.play();
    });
  })
}

/**
 * Script to play video only one at a time on any page 
 */
window.onload = function () {
  onloadCode();
  playOneVideoOnly();
  removeDownloadAttribute();
  playVideoOnThumbnailClick();
};

document.addEventListener("DOMContentLoaded", () => {
  onloadCode();
  playOneVideoOnly();
  removeDownloadAttribute();
  playVideoOnThumbnailClick();
});

Liferay.on("endNavigate", function () {
  playOneVideoOnly();
  removeDownloadAttribute()
});

function onloadCode() {
  window.onbeforeprint = () =>
    document.body.classList.add('printing');

  window.onafterprint = () =>
    document.body.classList.remove('printing');
}

async function preloadAndDecode(src) {
  const img = new Image();
  img.src = src;

  if (img.decode) {
    await img.decode();
  }
}

async function printWithWatermark() {
	let watermark = "Income-Tax-Department.svg";
	if( themeDisplay.getBCP47LanguageId() == "hi-IN" ){
		watermark = "Income-Tax-Department-Hindi.svg";
	}
	const watermarkURL = '/o/etds-theme-css/assets/images/' + watermark;
  await preloadAndDecode(watermarkURL);
  window.print();
}
  
function playOneVideoOnly() {
  const videos = document.querySelectorAll("video");
  videos.forEach(video => {
    video.addEventListener("play", () => {
      videos.forEach(v => {
        if (v !== video && !v.paused) {
          v.pause();
        }
      });
    });
  });
}

/**
 * Script to add "noopener" and "noreferrer" on all anchor tags
 */
function addRelAttributes() {
  document.querySelectorAll('a[target="_blank"]').forEach(a => {
    const rel = a.getAttribute("rel") || "";
    //if (!rel.includes("noopener")) a.setAttribute("rel", (rel + " noopener").trim());
    //if (!rel.includes("noreferrer")) a.setAttribute("rel", (a.getAttribute("rel") + " noreferrer").trim());
    
    if (!rel.includes("noreferrer")) a.setAttribute("rel", (rel + " noreferrer").trim());
  });
}

// Run once initially
addRelAttributes();

// Watch for dynamically added links
const observer = new MutationObserver(() => addRelAttributes());
observer.observe(document.body, { childList: true, subtree: true });
