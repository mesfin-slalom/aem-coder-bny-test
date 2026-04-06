/* eslint-disable import/prefer-default-export */

const placeholders = {};

async function fetchPlaceholders(prefix = 'default') {
  if (placeholders[prefix]) return placeholders[prefix];

  const resp = await fetch(`${prefix === 'default' ? '' : prefix}/placeholders.json`);
  if (!resp.ok) {
    placeholders[prefix] = {};
    return placeholders[prefix];
  }

  const json = await resp.json();
  const result = {};
  json.data.forEach((entry) => {
    result[entry.Key] = entry.Text;
  });

  placeholders[prefix] = result;
  return result;
}

export { fetchPlaceholders };
