import {useState} from "react";
import {GetStaticProps} from "next";
import moment from "moment";
import PortableText from "react-portable-text";

import Header from "../../components/Header";
import {sanityClient, urlFor} from "../../sanity.config";
import {Post} from "../../typings";
import Comments from "../../components/Comments";

import MapsUgcRoundedIcon from '@mui/icons-material/MapsUgcRounded';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import {log} from "util";

interface Props {
    post: Post
}

const Post = ({post}: Props) => {
    console.log(post)
    const [showComments, setShowComments] = useState<boolean>(false);
    const updateOpenCommentsStatue = (statue: boolean): void => {
        setShowComments(statue)
    }

    return <main>
        <Header/>
        <img className="w-full h-40 object-cover" src={urlFor(post.mainImage).url()} alt=""/>
        <article className="max-w-3xl mx-auto p-5">
            <h1 className="text-3xl font-bold mt-10 mb-3">{post.title}</h1>
            <h3 className="text-xl font-light text-gray-500 mb-3">{post.description}</h3>
            <div className="flex items-center space-x-3">
                <img className="w-10 h-10 rounded-full" src={urlFor(post.author.image).url()} alt="author avatar"/>
                <div>
                    <strong>{post.author.name}</strong>
                    <p className="text-sm font-extralight ">
                        Published {moment(post._createdAt).fromNow()}
                    </p>
                </div>

            </div>
            <div className="mt-5">
                <PortableText
                    dataset={process.env.NEXT_PUBLIC_SANITY_DATASET}
                    projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}
                    content={post.body}
                    serializers={{
                        h1: (props: any) => (
                            <h1 className="text-2xl font-bold my-5"  {...props} />
                        ),
                        h2: (props: any) => (
                            <h2 className="text-xl font-bold my-5"  {...props} />
                        ),
                        li: ({children}: any) => (
                            <li className="list-disc ml-8">{children}</li>
                        ),
                        link: ({href, children}: any) => (
                            <a className="text-blue-500 hover:underline" href={href}>{children}</a>
                        )
                    }}/>
            </div>
            <div className="flex justify-between items-center pt-10 pb-5">
                <div className="-rotate-90 text-gray-600 cursor-pointer" onClick={() => setShowComments(true)}>
                    <MapsUgcRoundedIcon sx={{fontSize: 30}}/>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="cursor-pointer text-gray-600 hover:text-gray-800">
                        <TwitterIcon sx={{fontSize: 30}}/>
                    </div>
                    <div className="cursor-pointer text-gray-600 hover:text-gray-800">
                        <FacebookIcon sx={{fontSize: 30}}/>
                    </div>
                    <div className="cursor-pointer text-gray-600 hover:text-gray-800">
                        <LinkedInIcon sx={{fontSize: 30}}/>
                    </div>
                    <div className="cursor-pointer text-gray-600 hover:text-gray-800">
                        <BookmarkIcon sx={{fontSize: 30}}/>
                    </div>
                </div>
            </div>
            <div className="flex items-center pb-10 pt-10 border-t border-gray-300">
                <img className="w-28 h-28 rounded-full" src={urlFor(post.author.image).url()} alt="author avatar"/>
                <div className="pl-5">
                    <h4 className="text-3xl font-bold">{post.author.name}</h4>
                    <p className="text-lg font-light pt-2">
                        Published {moment(post._createdAt).fromNow()}
                    </p>
                </div>
            </div>
        </article>
        <Comments postId={post._id} comments={post.comments} show={showComments} setClose={updateOpenCommentsStatue}/>
    </main>;
}

export default Post;

export const getStaticPaths = async () => {
    const query = `*[_type == "post"] {_id, slug {current}}`;
    const posts = await sanityClient.fetch(query)

    const paths = posts.map((post: Post) => ({
        params: {
            slug: post.slug.current
        }
    }))

    return {
        paths,
        fallback: "blocking"
    };
};

export const getStaticProps: GetStaticProps = async ({params}) => {
    const query = `*[_type == "post" && slug.current == $slug ][0] {_id, _createdAt, title, description, mainImage, slug, body, author -> {name, image}, 
    'comments': *[_type == "comment" && post._ref == ^._id && approved == true]}`
    const post = await sanityClient.fetch(query, {
        slug: params?.slug
    });

    if (!post) {
        return {
            notFound: true
        }
    }
    return {
        props: {
            post
        },
        revalidate: 5 // after 60 seconds it'll update the old cached version
    }
}