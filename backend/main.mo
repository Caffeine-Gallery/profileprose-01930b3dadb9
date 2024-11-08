import Bool "mo:base/Bool";

import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Hash "mo:base/Hash";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";

actor {
    // Types
    type Profile = {
        username: Text;
        bio: Text;
        avatar: Text;
        created: Time.Time;
    };

    type Post = {
        id: Nat;
        title: Text;
        content: Text;
        author: Principal;
        created: Time.Time;
        updated: Time.Time;
    };

    // Stable storage
    private stable var nextPostId : Nat = 0;
    private stable var profileEntries : [(Principal, Profile)] = [];
    private stable var postEntries : [(Nat, Post)] = [];

    // Runtime state
    private var profiles = HashMap.HashMap<Principal, Profile>(10, Principal.equal, Principal.hash);
    private var posts = HashMap.HashMap<Nat, Post>(10, Nat.equal, Hash.hash);

    // System functions
    system func preupgrade() {
        profileEntries := Iter.toArray(profiles.entries());
        postEntries := Iter.toArray(posts.entries());
    };

    system func postupgrade() {
        for ((principal, profile) in profileEntries.vals()) {
            profiles.put(principal, profile);
        };
        for ((id, post) in postEntries.vals()) {
            posts.put(id, post);
        };
    };

    // Profile management
    public shared(msg) func createProfile(username: Text, bio: Text, avatar: Text) : async Bool {
        let caller = msg.caller;
        if (Principal.isAnonymous(caller)) return false;

        let profile : Profile = {
            username = username;
            bio = bio;
            avatar = avatar;
            created = Time.now();
        };
        profiles.put(caller, profile);
        true
    };

    public query func getProfile(user: Principal) : async ?Profile {
        profiles.get(user)
    };

    public shared(msg) func updateProfile(username: Text, bio: Text, avatar: Text) : async Bool {
        let caller = msg.caller;
        if (Principal.isAnonymous(caller)) return false;

        switch (profiles.get(caller)) {
            case (null) { false };
            case (?existing) {
                let updated : Profile = {
                    username = username;
                    bio = bio;
                    avatar = avatar;
                    created = existing.created;
                };
                profiles.put(caller, updated);
                true
            };
        }
    };

    // Post management
    public shared(msg) func createPost(title: Text, content: Text) : async ?Nat {
        let caller = msg.caller;
        if (Principal.isAnonymous(caller)) return null;

        let post : Post = {
            id = nextPostId;
            title = title;
            content = content;
            author = caller;
            created = Time.now();
            updated = Time.now();
        };
        posts.put(nextPostId, post);
        nextPostId += 1;
        ?post.id
    };

    public query func getPost(id: Nat) : async ?Post {
        posts.get(id)
    };

    public shared(msg) func updatePost(id: Nat, title: Text, content: Text) : async Bool {
        let caller = msg.caller;
        
        switch (posts.get(id)) {
            case (null) { false };
            case (?post) {
                if (post.author != caller) { return false; };
                
                let updated : Post = {
                    id = id;
                    title = title;
                    content = content;
                    author = caller;
                    created = post.created;
                    updated = Time.now();
                };
                posts.put(id, updated);
                true
            };
        }
    };

    public shared(msg) func deletePost(id: Nat) : async Bool {
        let caller = msg.caller;
        
        switch (posts.get(id)) {
            case (null) { false };
            case (?post) {
                if (post.author != caller) { return false; };
                posts.delete(id);
                true
            };
        }
    };

    // Query functions
    public query func getAllPosts() : async [Post] {
        Iter.toArray(posts.vals())
    };

    public query func getPostsByUser(user: Principal) : async [Post] {
        let userPosts = Buffer.Buffer<Post>(0);
        for (post in posts.vals()) {
            if (post.author == user) {
                userPosts.add(post);
            };
        };
        Buffer.toArray(userPosts)
    };
}
