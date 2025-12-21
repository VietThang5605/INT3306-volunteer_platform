--
-- PostgreSQL database dump
--

\restrict NDtQC5kxnuKzPPiVjRlfjWo1qPPbwoTVmLvcCxQoWIs8EL7xwcdpsvGsRu0ni3s

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: EventStatus; Type: TYPE; Schema: public; Owner: myuser
--

CREATE TYPE public."EventStatus" AS ENUM (
    'DRAFT',
    'PENDING',
    'APPROVED',
    'CANCELLED',
    'COMPLETED'
);


ALTER TYPE public."EventStatus" OWNER TO myuser;

--
-- Name: NotificationTargetType; Type: TYPE; Schema: public; Owner: myuser
--

CREATE TYPE public."NotificationTargetType" AS ENUM (
    'EVENT',
    'POST',
    'REGISTRATION',
    'USER',
    'OTHER'
);


ALTER TYPE public."NotificationTargetType" OWNER TO myuser;

--
-- Name: PostStatus; Type: TYPE; Schema: public; Owner: myuser
--

CREATE TYPE public."PostStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."PostStatus" OWNER TO myuser;

--
-- Name: PostVisibility; Type: TYPE; Schema: public; Owner: myuser
--

CREATE TYPE public."PostVisibility" AS ENUM (
    'PUBLIC',
    'PRIVATE'
);


ALTER TYPE public."PostVisibility" OWNER TO myuser;

--
-- Name: RegistrationStatus; Type: TYPE; Schema: public; Owner: myuser
--

CREATE TYPE public."RegistrationStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'CANCELLED',
    'WAITLIST'
);


ALTER TYPE public."RegistrationStatus" OWNER TO myuser;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: myuser
--

CREATE TYPE public."UserRole" AS ENUM (
    'VOLUNTEER',
    'MANAGER',
    'ADMIN'
);


ALTER TYPE public."UserRole" OWNER TO myuser;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public."Category" (
    id integer NOT NULL,
    name text NOT NULL,
    description text
);


ALTER TABLE public."Category" OWNER TO myuser;

--
-- Name: Category_id_seq; Type: SEQUENCE; Schema: public; Owner: myuser
--

CREATE SEQUENCE public."Category_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Category_id_seq" OWNER TO myuser;

--
-- Name: Category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myuser
--

ALTER SEQUENCE public."Category_id_seq" OWNED BY public."Category".id;


--
-- Name: Comment; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public."Comment" (
    id uuid NOT NULL,
    "postId" uuid NOT NULL,
    "userId" uuid,
    content text NOT NULL,
    "parentId" text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."Comment" OWNER TO myuser;

--
-- Name: CommentLike; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public."CommentLike" (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "commentId" uuid NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."CommentLike" OWNER TO myuser;

--
-- Name: Event; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public."Event" (
    id uuid NOT NULL,
    name text NOT NULL,
    description text,
    location text,
    "startTime" timestamp with time zone,
    "endTime" timestamp with time zone,
    status public."EventStatus" DEFAULT 'DRAFT'::public."EventStatus" NOT NULL,
    "categoryId" integer,
    capacity integer,
    "coverUrl" text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "managerId" uuid NOT NULL
);


ALTER TABLE public."Event" OWNER TO myuser;

--
-- Name: EventRegistration; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public."EventRegistration" (
    id uuid NOT NULL,
    "eventId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    status public."RegistrationStatus" DEFAULT 'PENDING'::public."RegistrationStatus" NOT NULL,
    "registeredAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."EventRegistration" OWNER TO myuser;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public."Notification" (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    content text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "targetType" public."NotificationTargetType",
    "targetId" text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Notification" OWNER TO myuser;

--
-- Name: PasswordResetToken; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public."PasswordResetToken" (
    id uuid NOT NULL,
    token text NOT NULL,
    "userId" uuid NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."PasswordResetToken" OWNER TO myuser;

--
-- Name: Post; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public."Post" (
    id uuid NOT NULL,
    "eventId" uuid NOT NULL,
    "userId" uuid,
    content text NOT NULL,
    status public."PostStatus" DEFAULT 'PENDING'::public."PostStatus" NOT NULL,
    visibility public."PostVisibility" DEFAULT 'PUBLIC'::public."PostVisibility" NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."Post" OWNER TO myuser;

--
-- Name: PostLike; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public."PostLike" (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "postId" uuid NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PostLike" OWNER TO myuser;

--
-- Name: PostMedia; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public."PostMedia" (
    id uuid NOT NULL,
    url text NOT NULL,
    type text NOT NULL,
    "postId" uuid NOT NULL
);


ALTER TABLE public."PostMedia" OWNER TO myuser;

--
-- Name: PushSubscription; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public."PushSubscription" (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    "userAgent" text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PushSubscription" OWNER TO myuser;

--
-- Name: RefreshToken; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public."RefreshToken" (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    token text NOT NULL,
    device text,
    "ipAddress" text,
    revoked boolean DEFAULT false NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."RefreshToken" OWNER TO myuser;

--
-- Name: User; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public."User" (
    id uuid NOT NULL,
    "fullName" text NOT NULL,
    "avatarUrl" text,
    bio text,
    "phoneNumber" text NOT NULL,
    location text NOT NULL,
    dob date NOT NULL,
    email text NOT NULL,
    "passwordHash" text,
    "googleId" text,
    "avatarUrls" text,
    role public."UserRole" DEFAULT 'VOLUNTEER'::public."UserRole" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isEmailVerified" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO myuser;

--
-- Name: VerificationToken; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public."VerificationToken" (
    id uuid NOT NULL,
    token text NOT NULL,
    "userId" uuid NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."VerificationToken" OWNER TO myuser;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO myuser;

--
-- Name: Category id; Type: DEFAULT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."Category" ALTER COLUMN id SET DEFAULT nextval('public."Category_id_seq"'::regclass);


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: myuser
--

COPY public."Category" (id, name, description) FROM stdin;
1	Y tế	
2	Môi trường	
3	Giáo dục	
\.


--
-- Data for Name: Comment; Type: TABLE DATA; Schema: public; Owner: myuser
--

COPY public."Comment" (id, "postId", "userId", content, "parentId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CommentLike; Type: TABLE DATA; Schema: public; Owner: myuser
--

COPY public."CommentLike" (id, "userId", "commentId", "createdAt") FROM stdin;
\.


--
-- Data for Name: Event; Type: TABLE DATA; Schema: public; Owner: myuser
--

COPY public."Event" (id, name, description, location, "startTime", "endTime", status, "categoryId", capacity, "coverUrl", "createdAt", "updatedAt", "managerId") FROM stdin;
a24add90-6fb0-453f-9fd8-6702bfffb61b	Dạy học cho trẻ em vùng cao	Hành trình Gieo chữ - Thắp sáng ước mơ vùng cao\n\nTham gia cùng chúng tôi trong chuyến hành trình ý nghĩa mang tri thức đến với các em nhỏ tại các điểm trường khó khăn. Chúng tôi tin rằng giáo dục là chìa khóa mở ra tương lai tươi sáng hơn.\n\nHoạt động chính: Tổ chức lớp ôn tập văn hóa (Toán, Tiếng Việt, Tiếng Anh), hướng dẫn kỹ năng sống, tổ chức trò chơi tập thể và trao tặng dũng cụ học tập.\n\nÝ nghĩa: Truyền cảm hứng học tập, mang lại niềm vui và sự động viên tinh thần to lớn cho các em nhỏ vùng cao, góp phần thu hẹp khoảng cách giáo dục.	Hà Giang	2026-01-23 00:00:00+00	2026-01-23 03:00:00+00	APPROVED	3	3	\N	2025-12-21 08:08:33.036+00	2025-12-21 08:15:06.507+00	f00c2cbd-9706-4c22-a7ec-6253f22928e8
862a7af9-2023-41d9-a99c-dfa93b27f731	Dọn dẹp bãi biển Nha Trang	Bờ biển Nha Trang xinh đẹp đang cần sự chung tay của bạn! Hãy cùng chúng tôi hành động để trả lại vẻ đẹp nguyên sơ và môi trường trong lành cho biển cả.\n\nHoạt động chính: Thu gom rác thải nhựa, dọn sạch bãi bờ dọc theo tuyến đường Trần Phú và các khu vực lân cận; phân loại rác tại nguồn và tuyên truyền nâng cao ý thức bảo vệ môi trường cho du khách.\n\nÝ nghĩa: Góp phần bảo vệ hệ sinh thái biển, giữ gìn cảnh quan du lịch và lan tỏa thông điệp sống xanh, hạn chế rác thải nhựa tới cộng đồng.	Nha Trang	2025-12-21 09:00:00+00	2025-12-21 10:00:00+00	PENDING	2	10	\N	2025-12-21 08:20:41.493+00	2025-12-21 08:20:41.493+00	f00c2cbd-9706-4c22-a7ec-6253f22928e8
6772db03-2a96-487e-bf8f-e859d9d77797	Chiến dịch trồng cây gây rừng	Mầm Xanh Tương Lai - Phủ xanh đồi trọc Mô tả: Mỗi cái cây được trồng xuống là một niềm hy vọng được thắp lên. Hãy cùng chúng tôi để lại dấu ấn xanh cho Trái Đất thông qua hoạt động trồng rừng thiết thực này.\r\n\r\nHoạt động chính: Trồng mới cây xanh (keo, bạch đàn, hoặc cây bản địa) tại khu vực đất trống đồi trọc; phát quang bụi rậm và chăm sóc cây non đã trồng.\r\n\r\nÝ nghĩa: Chống xói mòn đất, cân bằng hệ sinh thái, giảm thiểu tác động của biến đổi khí hậu và tạo lá phổi xanh cho khu vực.	Cao Bằng	2025-12-27 01:00:00+00	2025-12-27 03:00:00+00	PENDING	2	20	https://res.cloudinary.com/dlbotutlu/image/upload/v1766305530/volunteer-hub/ds26giurvpyqod353zin.png	2025-12-21 08:25:30.967+00	2025-12-21 08:25:30.967+00	f00c2cbd-9706-4c22-a7ec-6253f22928e8
\.


--
-- Data for Name: EventRegistration; Type: TABLE DATA; Schema: public; Owner: myuser
--

COPY public."EventRegistration" (id, "eventId", "userId", status, "registeredAt") FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: myuser
--

COPY public."Notification" (id, "userId", content, "isRead", "targetType", "targetId", "createdAt") FROM stdin;
3169fdec-fe60-4f0b-8bfd-7bd2a9ef619a	f00c2cbd-9706-4c22-a7ec-6253f22928e8	Sự kiện "Dạy học cho trẻ em vùng cao" của bạn đã được quản trị viên duyệt.	f	EVENT	a24add90-6fb0-453f-9fd8-6702bfffb61b	2025-12-21 08:15:06.519+00
\.


--
-- Data for Name: PasswordResetToken; Type: TABLE DATA; Schema: public; Owner: myuser
--

COPY public."PasswordResetToken" (id, token, "userId", "expiresAt") FROM stdin;
\.


--
-- Data for Name: Post; Type: TABLE DATA; Schema: public; Owner: myuser
--

COPY public."Post" (id, "eventId", "userId", content, status, visibility, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PostLike; Type: TABLE DATA; Schema: public; Owner: myuser
--

COPY public."PostLike" (id, "userId", "postId", "createdAt") FROM stdin;
\.


--
-- Data for Name: PostMedia; Type: TABLE DATA; Schema: public; Owner: myuser
--

COPY public."PostMedia" (id, url, type, "postId") FROM stdin;
\.


--
-- Data for Name: PushSubscription; Type: TABLE DATA; Schema: public; Owner: myuser
--

COPY public."PushSubscription" (id, "userId", endpoint, p256dh, auth, "userAgent", "createdAt") FROM stdin;
5d30a6af-0955-4084-8a72-9f0e466b2c79	f00c2cbd-9706-4c22-a7ec-6253f22928e8	https://updates.push.services.mozilla.com/wpush/v2/gAAAAABpR2Gpq_Gac-GxnMBAfeu_sAlebpUl01H5dRQPgO10N1rejNTjxqH_9ncTWWH2wyuFMbxorz7Ee9DK3eEFV1850iOSfr8ob-AMFcJD-rwMV6CqaslojA9kwm7sh7MD6Yf2Hc2r5Vwbx39E9gTDE8juu0jRQr1k3jTmVcQ8xObgRtEY_Ns	BIdmWessIshxafKjHyGC4I5Eu1WT1XLN-7C9T2YOP7CuCziguT8m3mXlCBn89WWSeOFappjatJ4N0cy6Dt3-Qrs	Zq25tlxlqjtOnpf39WYvBw	axios/1.13.2	2025-12-21 08:00:26.669+00
1fb3b12f-70b8-4c4c-a953-4dca2dc3a894	e5c7855c-c4c7-4f12-a0c4-d5bd69d86335	https://updates.push.services.mozilla.com/wpush/v2/gAAAAABpR2E1n398gvQKg3oCvO80wdpgg9BlUO_UjAL2-PgfOEwumvFWfHRPgvni9sLXutsJXjQbrbcLdX0xLUE4aOEGFmwXz3iYgH4lhsQNVZrL_wIxUpDxJSZRYjvfLKlimLsGLepyc-XhYV1at1n0rsaoNK22tRJarbYW6aAfQ-DFgwGVrR8	BKZyHRyR1zdE-oQMn52QKfKNegd6HWz0fXoqZUh60eL6hgcbWXbrwYCsG9b02bYLxst7WL0JFmvDCDOLu7WC5pA	vgRoXTe4T5Geqd3VGYeDNQ	axios/1.13.2	2025-12-21 08:20:34.69+00
\.


--
-- Data for Name: RefreshToken; Type: TABLE DATA; Schema: public; Owner: myuser
--

COPY public."RefreshToken" (id, "userId", token, device, "ipAddress", revoked, "createdAt", "expiresAt") FROM stdin;
9e96c3bd-8cbf-44ef-b5ea-bc3ad5f8f1da	e5c7855c-c4c7-4f12-a0c4-d5bd69d86335	7ccb051a6102e15e36410d0415726e5c258cf5b1667079d0ba4aa37a32b9d9cf	null	null	f	2025-12-21 07:18:55.113+00	2025-12-22 07:18:55.11+00
7800583f-1261-4bea-8b8c-c1825e31c1ea	e5c7855c-c4c7-4f12-a0c4-d5bd69d86335	58e720fab9cbe8941e55dd75060e0589f34879c4d6c08d3245d315e35009cd43	null	null	f	2025-12-21 07:37:13.82+00	2025-12-22 07:37:13.816+00
5c4966f8-6a78-49e7-a080-4f559a94816f	e5c7855c-c4c7-4f12-a0c4-d5bd69d86335	b1e4f813edc870446884697a5ab640a14c972ee4cc5dc051f0590b470b6d890c	null	null	f	2025-12-21 07:39:01.804+00	2025-12-22 07:39:01.802+00
fa0c65bf-0663-4d7e-93da-7e1ac999411b	a8170c44-0ff3-467c-927f-d3d703168e4e	e29feae5307bfc75c27a58834fd6628e0fe5e195da1fbff257b4a36905d988a3	null	null	f	2025-12-21 07:39:25.613+00	2025-12-22 07:39:25.61+00
3ab82dee-32b0-4500-8e49-d28904cc9c14	bfde9f1a-a61b-4920-b376-0d97bfb0e58a	409cb9702e276a9afaf268392d481cdcd5ff19f81a2d3aad5a0acdc59e723e9b	null	null	f	2025-12-21 07:40:41.363+00	2025-12-22 07:40:41.362+00
9b8dd90b-3332-44d3-bdc7-b6e524cc777c	9d14b46e-139d-4b95-a352-97c097ccbf30	19d45c2c89d063dd040ef7a87f581895848fe7c6bd76ab67c82aa83de2f82f35	null	null	f	2025-12-21 07:44:53.402+00	2025-12-22 07:44:53.401+00
98f1b13a-0ac9-489e-acd9-396adb6983ed	08b0c0ad-21dd-4ce4-aafe-d2b6a76ece4b	2ac05757b5b7967984998fd01096122e7c786d296eb38a395d2d26905436235b	null	null	f	2025-12-21 07:54:05.795+00	2025-12-22 07:54:05.794+00
c8864bab-1da5-400c-b24a-6f0a521ebed3	f00c2cbd-9706-4c22-a7ec-6253f22928e8	5884d07b0782b5dd8a02b8f537048bfa3405382999953957b6adfeea9d8ab83a	null	null	f	2025-12-21 07:57:50.004+00	2025-12-22 07:57:49.995+00
65a85d7d-61c0-4840-a336-5ff497052858	f00c2cbd-9706-4c22-a7ec-6253f22928e8	6b8c5ca2b43f8ad119318202ab02b08f0b143deaed199df2798c2afa04770807	null	null	f	2025-12-21 08:00:08.622+00	2025-12-22 08:00:08.62+00
0692a4c1-7b0b-4132-b42e-6ea7db072d57	f00c2cbd-9706-4c22-a7ec-6253f22928e8	9d5d437443639f2a46366032e64247894a13c4ec49eaa9b4dd02fd17369e7391	null	null	f	2025-12-21 08:18:41.24+00	2025-12-22 08:18:41.235+00
817e0beb-44a3-4a6b-8bf1-b345b83f0aba	e5c7855c-c4c7-4f12-a0c4-d5bd69d86335	39f02cb2a2b6d36d7496977acbc68a2f27917f54c6b6ad0e68875d810e7b0325	null	null	f	2025-12-21 08:19:18.222+00	2025-12-22 08:19:18.22+00
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: myuser
--

COPY public."User" (id, "fullName", "avatarUrl", bio, "phoneNumber", location, dob, email, "passwordHash", "googleId", "avatarUrls", role, "isActive", "isEmailVerified", "createdAt", "updatedAt") FROM stdin;
e5c7855c-c4c7-4f12-a0c4-d5bd69d86335	Admin	\N	\N	null	null	1979-12-31	admin@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$1sAEOJvkWh5dbnR0jM56NQ$8lqtSxBuZL3H20qjoRK1y65bm9xkPnA+vDlf5cNxFx8	\N	\N	ADMIN	t	t	2025-12-21 07:18:31.578+00	2025-12-21 07:18:31.578+00
cbe642c2-489e-4076-bedb-9ed445ae75cf	Volunteer 2	\N	\N	null	null	1979-12-31	Volunteer2@gmai.com	$argon2id$v=19$m=65536,t=3,p=4$QE0ZmeboFYDk8gW7xFb8pg$T+SQqsSLvvQpoBHffIth62zwXZG6+sM98ml7Cse3vjw	\N	\N	VOLUNTEER	t	t	2025-12-21 07:26:41.392+00	2025-12-21 07:26:41.392+00
a8170c44-0ff3-467c-927f-d3d703168e4e	Volunteer 1	https://res.cloudinary.com/dlbotutlu/image/upload/v1766302286/volunteer-hub/k8tp53jsc1qppav6ve8d.png		null	Hà Nội	2000-12-12	Volunteer1@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$4m/yELwuDoBM02pkrtuBHQ$a77Kx3Iih235lAybyhzUl9ThqJXU+iF3EwU/L7CMX68	\N	\N	VOLUNTEER	t	t	2025-12-21 07:28:17.805+00	2025-12-21 07:37:00.67+00
bfde9f1a-a61b-4920-b376-0d97bfb0e58a	Volunteer 3	https://res.cloudinary.com/dlbotutlu/image/upload/v1766302990/volunteer-hub/cdoxf7hxdcf8x4ipqfrt.png		0345128386	Đà Nẵng	2005-02-10	Volunteer3@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$C7mhzTKIC4GZPoNmP/zudg$7go1NAFIw2MpzbiqfqUUoADco/X2/H5HWSz7p5pPC5o	\N	\N	VOLUNTEER	t	t	2025-12-21 07:27:24.792+00	2025-12-21 07:43:12.816+00
9d14b46e-139d-4b95-a352-97c097ccbf30	Volunteer 4	https://res.cloudinary.com/dlbotutlu/image/upload/v1766303409/volunteer-hub/kadlr0uqin24wntcx01i.png		null	null	1979-12-31	Volunteer4@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$7uavyQYr+UUGhMsb/nH+fw$baSpdg5SAIEhahR+BwWgSlMKSIZSdXfjzoxMI6wK4oA	\N	\N	VOLUNTEER	t	t	2025-12-21 07:27:43.399+00	2025-12-21 07:50:12.807+00
08b0c0ad-21dd-4ce4-aafe-d2b6a76ece4b	Volunteer 5	https://res.cloudinary.com/dlbotutlu/image/upload/v1766303683/volunteer-hub/ggffuksvtdnbn3hzk4pe.png		null	null	1998-02-05	Volunteer5@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$YDUKwTb+KkZPZrDLMidXzg$VWHUNztmvSBYXkPpLtr4ozwgn6HTzj8oIOJ5KxvsurA	\N	\N	VOLUNTEER	t	t	2025-12-21 07:51:51.129+00	2025-12-21 07:54:45.389+00
f00c2cbd-9706-4c22-a7ec-6253f22928e8	Nguyễn Việt Thắng	https://res.cloudinary.com/dlbotutlu/image/upload/v1766304073/volunteer-hub/gy9raxhowrahdbfyoebs.jpg		0984712502	Lào Cai	2005-06-05	tkmodthang@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$i7TITBhfD9SEMx2OcOGblw$4Ho25a0FhMfNMFJvKGj8u1MDPixk3gkBpONL8AZr5GQ	\N	\N	MANAGER	t	t	2025-12-21 07:52:32.286+00	2025-12-21 08:01:14.369+00
\.


--
-- Data for Name: VerificationToken; Type: TABLE DATA; Schema: public; Owner: myuser
--

COPY public."VerificationToken" (id, token, "userId", "expiresAt") FROM stdin;
be88d132-50d6-48ee-ad0e-5e42211b7327	b3c519b32aca1373d423336f6d9ac40f508aab3cd2cd311d11b285fbdd676ba6	e5c7855c-c4c7-4f12-a0c4-d5bd69d86335	2025-12-21 08:18:31.591+00
6316124a-d040-4c1d-ae00-5e391b674134	ca4dbd509acd6c814fd5651ad2339ddd5671d419856f4c9bd3c490fae9e4438a	cbe642c2-489e-4076-bedb-9ed445ae75cf	2025-12-21 08:26:41.397+00
62d9b8ef-4aed-4281-bb1e-09f7d47a5c91	f4f9a150feb9e7d81f628f7f5d1e27fd8060513d8fb94e122c5cb501c2fbe172	bfde9f1a-a61b-4920-b376-0d97bfb0e58a	2025-12-21 08:27:24.794+00
b4661e22-4a4e-4c16-919d-060c8027f3b7	3576f32c7dd631d7219056d84d10710d7dbaf26ad94b9ee5afe8dd625f426815	9d14b46e-139d-4b95-a352-97c097ccbf30	2025-12-21 08:27:43.401+00
dd056746-54e6-48c9-88f8-d228b0893088	f24af05841c67f767236d5fdf87d289f4fa67038c416abe1a692101a9e398a44	a8170c44-0ff3-467c-927f-d3d703168e4e	2025-12-21 08:28:17.807+00
d8293720-5c4a-41ff-97a2-bd491db6fbf2	db35dc3de0f6e77d003dc94eb29eeff6accf1718b19ba122b3c09b976a698cb3	08b0c0ad-21dd-4ce4-aafe-d2b6a76ece4b	2025-12-21 08:51:51.134+00
a3a62f73-ed40-4344-aa53-6d9fb4f59ca9	fae3c0983109ebf50aafbf098c4abd1062a29298a89559e71aeddc3c0df11098	f00c2cbd-9706-4c22-a7ec-6253f22928e8	2025-12-21 08:52:32.291+00
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: myuser
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
20df4dc0-1d0f-4b28-b40a-f87cda18cfb2	27e088916fe7b7514aacb223b7bf6805459e1ba3899a2d677f1d595b5f4276df	2025-12-21 07:17:06.430293+00	20251221070103_init	\N	\N	2025-12-21 07:17:06.097429+00	1
\.


--
-- Name: Category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: myuser
--

SELECT pg_catalog.setval('public."Category_id_seq"', 3, true);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: CommentLike CommentLike_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."CommentLike"
    ADD CONSTRAINT "CommentLike_pkey" PRIMARY KEY (id);


--
-- Name: Comment Comment_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_pkey" PRIMARY KEY (id);


--
-- Name: EventRegistration EventRegistration_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."EventRegistration"
    ADD CONSTRAINT "EventRegistration_pkey" PRIMARY KEY (id);


--
-- Name: Event Event_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: PasswordResetToken PasswordResetToken_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY (id);


--
-- Name: PostLike PostLike_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."PostLike"
    ADD CONSTRAINT "PostLike_pkey" PRIMARY KEY (id);


--
-- Name: PostMedia PostMedia_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."PostMedia"
    ADD CONSTRAINT "PostMedia_pkey" PRIMARY KEY (id);


--
-- Name: Post Post_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_pkey" PRIMARY KEY (id);


--
-- Name: PushSubscription PushSubscription_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."PushSubscription"
    ADD CONSTRAINT "PushSubscription_pkey" PRIMARY KEY (id);


--
-- Name: RefreshToken RefreshToken_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: VerificationToken VerificationToken_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."VerificationToken"
    ADD CONSTRAINT "VerificationToken_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Category_name_key; Type: INDEX; Schema: public; Owner: myuser
--

CREATE UNIQUE INDEX "Category_name_key" ON public."Category" USING btree (name);


--
-- Name: CommentLike_commentId_idx; Type: INDEX; Schema: public; Owner: myuser
--

CREATE INDEX "CommentLike_commentId_idx" ON public."CommentLike" USING btree ("commentId");


--
-- Name: CommentLike_userId_commentId_key; Type: INDEX; Schema: public; Owner: myuser
--

CREATE UNIQUE INDEX "CommentLike_userId_commentId_key" ON public."CommentLike" USING btree ("userId", "commentId");


--
-- Name: Comment_postId_idx; Type: INDEX; Schema: public; Owner: myuser
--

CREATE INDEX "Comment_postId_idx" ON public."Comment" USING btree ("postId");


--
-- Name: EventRegistration_eventId_idx; Type: INDEX; Schema: public; Owner: myuser
--

CREATE INDEX "EventRegistration_eventId_idx" ON public."EventRegistration" USING btree ("eventId");


--
-- Name: EventRegistration_userId_eventId_key; Type: INDEX; Schema: public; Owner: myuser
--

CREATE UNIQUE INDEX "EventRegistration_userId_eventId_key" ON public."EventRegistration" USING btree ("userId", "eventId");


--
-- Name: EventRegistration_userId_idx; Type: INDEX; Schema: public; Owner: myuser
--

CREATE INDEX "EventRegistration_userId_idx" ON public."EventRegistration" USING btree ("userId");


--
-- Name: Event_categoryId_idx; Type: INDEX; Schema: public; Owner: myuser
--

CREATE INDEX "Event_categoryId_idx" ON public."Event" USING btree ("categoryId");


--
-- Name: Event_startTime_idx; Type: INDEX; Schema: public; Owner: myuser
--

CREATE INDEX "Event_startTime_idx" ON public."Event" USING btree ("startTime");


--
-- Name: Notification_userId_isRead_idx; Type: INDEX; Schema: public; Owner: myuser
--

CREATE INDEX "Notification_userId_isRead_idx" ON public."Notification" USING btree ("userId", "isRead");


--
-- Name: PasswordResetToken_token_key; Type: INDEX; Schema: public; Owner: myuser
--

CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON public."PasswordResetToken" USING btree (token);


--
-- Name: PostLike_postId_idx; Type: INDEX; Schema: public; Owner: myuser
--

CREATE INDEX "PostLike_postId_idx" ON public."PostLike" USING btree ("postId");


--
-- Name: PostLike_userId_postId_key; Type: INDEX; Schema: public; Owner: myuser
--

CREATE UNIQUE INDEX "PostLike_userId_postId_key" ON public."PostLike" USING btree ("userId", "postId");


--
-- Name: Post_eventId_idx; Type: INDEX; Schema: public; Owner: myuser
--

CREATE INDEX "Post_eventId_idx" ON public."Post" USING btree ("eventId");


--
-- Name: PushSubscription_endpoint_key; Type: INDEX; Schema: public; Owner: myuser
--

CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON public."PushSubscription" USING btree (endpoint);


--
-- Name: PushSubscription_userId_idx; Type: INDEX; Schema: public; Owner: myuser
--

CREATE INDEX "PushSubscription_userId_idx" ON public."PushSubscription" USING btree ("userId");


--
-- Name: RefreshToken_token_key; Type: INDEX; Schema: public; Owner: myuser
--

CREATE UNIQUE INDEX "RefreshToken_token_key" ON public."RefreshToken" USING btree (token);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: myuser
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_googleId_key; Type: INDEX; Schema: public; Owner: myuser
--

CREATE UNIQUE INDEX "User_googleId_key" ON public."User" USING btree ("googleId");


--
-- Name: VerificationToken_token_key; Type: INDEX; Schema: public; Owner: myuser
--

CREATE UNIQUE INDEX "VerificationToken_token_key" ON public."VerificationToken" USING btree (token);


--
-- Name: CommentLike CommentLike_commentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."CommentLike"
    ADD CONSTRAINT "CommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES public."Comment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CommentLike CommentLike_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."CommentLike"
    ADD CONSTRAINT "CommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Comment Comment_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Comment Comment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EventRegistration EventRegistration_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."EventRegistration"
    ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EventRegistration EventRegistration_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."EventRegistration"
    ADD CONSTRAINT "EventRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Event Event_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Event Event_managerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PasswordResetToken PasswordResetToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PostLike PostLike_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."PostLike"
    ADD CONSTRAINT "PostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PostLike PostLike_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."PostLike"
    ADD CONSTRAINT "PostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PostMedia PostMedia_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."PostMedia"
    ADD CONSTRAINT "PostMedia_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Post Post_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Post Post_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PushSubscription PushSubscription_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."PushSubscription"
    ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RefreshToken RefreshToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: VerificationToken VerificationToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."VerificationToken"
    ADD CONSTRAINT "VerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict NDtQC5kxnuKzPPiVjRlfjWo1qPPbwoTVmLvcCxQoWIs8EL7xwcdpsvGsRu0ni3s

