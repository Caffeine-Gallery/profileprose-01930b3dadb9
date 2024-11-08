export const idlFactory = ({ IDL }) => {
  const Time = IDL.Int;
  const Post = IDL.Record({
    'id' : IDL.Nat,
    'title' : IDL.Text,
    'created' : Time,
    'content' : IDL.Text,
    'author' : IDL.Principal,
    'updated' : Time,
  });
  const Profile = IDL.Record({
    'bio' : IDL.Text,
    'created' : Time,
    'username' : IDL.Text,
    'avatar' : IDL.Text,
  });
  return IDL.Service({
    'createPost' : IDL.Func([IDL.Text, IDL.Text], [IDL.Opt(IDL.Nat)], []),
    'createProfile' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Bool], []),
    'deletePost' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'getAllPosts' : IDL.Func([], [IDL.Vec(Post)], ['query']),
    'getPost' : IDL.Func([IDL.Nat], [IDL.Opt(Post)], ['query']),
    'getPostsByUser' : IDL.Func([IDL.Principal], [IDL.Vec(Post)], ['query']),
    'getProfile' : IDL.Func([IDL.Principal], [IDL.Opt(Profile)], ['query']),
    'updatePost' : IDL.Func([IDL.Nat, IDL.Text, IDL.Text], [IDL.Bool], []),
    'updateProfile' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Bool], []),
  });
};
export const init = ({ IDL }) => { return []; };
