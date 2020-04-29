import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Base } from 'jw25519';

const { base58 } = Base;

export default function ServerSideEnv({ allows }) {
  const env = _.pick(process.env, allows);
  const data = `__ENV__ = "${base58.encode(Buffer.from(JSON.stringify(env)))}"`;

  return React.createElement('script', {
    dangerouslySetInnerHTML: { __html: data },
  });
}

ServerSideEnv.propTypes = {
  allows: PropTypes.arrayOf(PropTypes.string).isRequired,
};
