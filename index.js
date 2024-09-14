const FEED_ITEM_TAG = 'feedItem-by-';
const THREAD_ITEM_TAG = 'postThreadItem-by-';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
      createBtnsEventListeners();
      setObservers();
    }, 1000);
  });
} else {
  setTimeout(() => {
    createBtnsEventListeners();
    setObservers();
  }, 1000);
}

function setObservers() {
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        createBtnsEventListeners();
      }
    });
  });

  const feedLists = document.querySelectorAll('[data-testid*=FeedPage-feed-flatlist]');
  feedLists.forEach(function (list) {
    observer.observe(list.childNodes[1], { childList: true });
  });
}

function createBtnsEventListeners() {
  const postDropdownBtn = document.querySelectorAll('[data-testid=postDropdownBtn]');

  if (!postDropdownBtn.length) {
    setTimeout(createBtnsEventListeners, 1000);
  }

  for (const btn of postDropdownBtn.values()) {
    if (btn.offsetParent !== null) {
      const rootNode = searchRootNode(btn);
      const username = getPostUsername(rootNode);
      btn.addEventListener('click', configurePostDropdownClick(username));
    }
  }
}

function searchRootNode(node) {
  const feedItem = node.closest(`[data-testid*=${FEED_ITEM_TAG}]`);
  const postItem = node.closest(`[data-testid*=${THREAD_ITEM_TAG}]`);
  return feedItem || postItem;
}

function getPostUsername(node) {
  const testid = node.dataset.testid;
  if (testid.match(FEED_ITEM_TAG)) {
    return testid.replace(FEED_ITEM_TAG, '');
  }

  return testid.replace(THREAD_ITEM_TAG, '');
}

function configurePostDropdownClick(username) {
  return () => {
    setTimeout(() => {
      if (buttonHasAlreadyExists()) return true;

      const postDropdownReportBtn = document.querySelector('[data-testid=postDropdownReportBtn]');

      const buttonBlockUser = createBlockUserBtn(postDropdownReportBtn, username);
      postDropdownReportBtn.parentNode.appendChild(buttonBlockUser);
    }, 500);
  };
}

function buttonHasAlreadyExists() {
  return !!document.querySelector('[data-testid=postDropdownBlockBtn]');
}

function createBlockUserBtn(baseBtn, username) {
  const btn = baseBtn.cloneNode(true);
  btn.childNodes[0].innerText = 'Block Account';
  btn.childNodes[1].innerHTML = `<svg fill="none" viewBox="0 0 24 24" width="20" height="20"><path fill="hsl(211, 20%, 73.6%)" fill-rule="evenodd" clip-rule="evenodd" d="M12 4a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM7.5 6.5a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM5.679 19c.709-2.902 3.079-5 6.321-5 .302 0 .595.018.878.053a1 1 0 0 0 .243-1.985A9.235 9.235 0 0 0 12 12c-4.3 0-7.447 2.884-8.304 6.696-.29 1.29.767 2.304 1.902 2.304H12a1 1 0 1 0 0-2H5.679Zm9.614-3.707a1 1 0 0 1 1.414 0L18 16.586l1.293-1.293a1 1 0 0 1 1.414 1.414L19.414 18l1.293 1.293a1 1 0 0 1-1.414 1.414L18 19.414l-1.293 1.293a1 1 0 0 1-1.414-1.414L16.586 18l-1.293-1.293a1 1 0 0 1 0-1.414Z"></path></svg>`;

  btn.setAttribute('ariaLabel', 'Block Account');
  btn.setAttribute('data-testid', 'postDropdownBlockBtn');

  btn.setAttribute('onmouseover', `this.style.background='rgb(38, 53, 68)';`);
  btn.setAttribute('onmouseout', `this.style.background='transparent'`);

  btn.addEventListener('click', () => blockUser(username));

  return btn;
}

async function blockUser(name) {
  try {
    const bskyStorage = safeParseJSON(window.localStorage.getItem('BSKY_STORAGE'));
    const userProfile = await getProfile(name);

    const url = `${bskyStorage.session?.currentAccount?.pdsUrl}xrpc/com.atproto.repo.createRecord`;
    const body = JSON.stringify({
      collection: 'app.bsky.graph.block',
      repo: bskyStorage.session?.currentAccount?.did,
      record: {
        subject: userProfile.did,
        createdAt: new Date(),
        $type: 'app.bsky.graph.block',
      },
    });
    await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${bskyStorage.session?.currentAccount?.accessJwt}`,
      },
      body,
      method: 'POST',
    });
    window.alert(`user  "${name}" has been blocked`);
  } catch (error) {
    window._log?.('block user error: ', error);
  }
}

async function getProfile(actor) {
  const bskyStorage = safeParseJSON(window.localStorage.getItem('BSKY_STORAGE'));
  const url = `${bskyStorage.session?.currentAccount?.pdsUrl}xrpc/app.bsky.actor.getProfile?actor=${window.encodeURIComponent(actor)}`;

  const profile = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${bskyStorage.session?.currentAccount?.accessJwt}`,
    },
  });

  return profile.json();
}

function safeParseJSON(value) {
  try {
    const parsed = JSON.parse(value);
    return parsed;
  } catch (error) {
    window._log?.(error);
    return {};
  }
}
