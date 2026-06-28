module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  env: {
    test: {
      plugins: [
        function viteMetaEnv() {
          return {
            visitor: {
              MemberExpression(path) {
                const { object, property } = path.node
                if (
                  object?.type === 'MetaProperty' &&
                  object.meta.name === 'import' &&
                  object.property.name === 'meta' &&
                  property.type === 'Identifier' &&
                  property.name === 'env'
                ) {
                  path.replaceWithSourceString('{ VITE_API_URL: "" }')
                }
              },
            },
          }
        },
      ],
    },
  },
}
