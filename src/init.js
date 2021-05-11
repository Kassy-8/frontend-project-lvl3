import * as yup from 'yup';
import axios from 'axios';
import parseRss from './parseRss.js';
import _ from 'lodash';

const errorMessages = {
  incorrectUrl: 'Некорректный url',
  duplicateUrl: 'Url уже присутствует в списке фидов',
};

const getAllOriginsUrl = () => 'https://hexlet-allorigins.herokuapp.com/raw';
const buildUrl = (link) => {
  const url = new URL(getAllOriginsUrl());
  url.searchParams.append('url', link);
  return url;
};

const isDuplicateUrl = (value, state) => state.feedList.includes(value);

const validateUrl = (value, state) => {
  const schema = yup.string().url(errorMessages.incorrectUrl);
  try {
    schema.validateSync(value);
    if (isDuplicateUrl(value, state)) {
      return errorMessages.duplicateUrl;
    }
    return null;
  } catch (error) {
    return error.message;
  }
};

export default () => {
  const state = {
    linkList: [],
    feedList: [],
    topics: [],
    networkError: [],
    form: {
      status: 'filing',
      validation: {
        valid: true,
        error: null,
      },
    },
  };

  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('#url'),
    submit: document.querySelector('.btn[type="submit"]'),
  };
/*
здесь будет обертка стейта в вотчд стейт
*/

  elements.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(elements.form);
    const userUrl = formData.get('url').trim();
    console.log('url', userUrl);
    const error = validateUrl(userUrl, state);
    console.log('error', error);

    if (error) {
      state.form.validation = {
        valid: false,
        error,
      };
      return;
    }

    state.form.validation.valid = true;
    state.linkList.push(userUrl);
    console.log('state', state);

    const url = buildUrl(userUrl);
    console.log('url for axios', url);
    axios.get(url)
      .then((response) => {
        console.log(response);
        const rssData = parseRss(response.data);
        console.log('rssData', rssData);
        return rssData;
      })
      .catch((err) => console.log(err))
      .then((rssData) => {
        const id = _.uniqueId();
        const { title, description, topics } = rssData;
        const newFeed = { id, title, description };
        topics.id = id;
        state.feedList.push(newFeed);
        state.topics.push(topics);
      });
  });
};
