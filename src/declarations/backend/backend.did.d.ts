import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Post {
  'id' : bigint,
  'title' : string,
  'created' : Time,
  'content' : string,
  'author' : Principal,
  'updated' : Time,
}
export interface Profile {
  'bio' : string,
  'created' : Time,
  'username' : string,
  'avatar' : string,
}
export type Time = bigint;
export interface _SERVICE {
  'createPost' : ActorMethod<[string, string], [] | [bigint]>,
  'createProfile' : ActorMethod<[string, string, string], boolean>,
  'deletePost' : ActorMethod<[bigint], boolean>,
  'getAllPosts' : ActorMethod<[], Array<Post>>,
  'getPost' : ActorMethod<[bigint], [] | [Post]>,
  'getPostsByUser' : ActorMethod<[Principal], Array<Post>>,
  'getProfile' : ActorMethod<[Principal], [] | [Profile]>,
  'updatePost' : ActorMethod<[bigint, string, string], boolean>,
  'updateProfile' : ActorMethod<[string, string, string], boolean>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
