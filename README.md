# 스트리밍 서비스 개발

클라우드 서비스(Azure, AWS) 를 이용한 스트리밍 서비스 설계 및 로드 밸런싱  
코딩보다 개발에 중점을 두었습니다.

---
#### 시스템 한정
---
- 사용자가 웹 브라우저를 통해 서버의 주소에 접속할 수 있다.
- 서버는 저장되어 있는 동영상 링크를 전송한다.
- 사용자는 웹 브라우저를 통해 해당 동영상을 시청할 수 있다.
- 사용자는 동영상 시청 중 다양한 기능을 사용할 수 있다.
  - (시간 이동, 재생 속도 조절, 영상 화질 조절, 자막 설정, 전체 화면 재생)
- 특정 사용자는 인터넷 상에 공개된 동영상을 서버에 업로드할 수 있다.

---
#### 합리적 가정
---
- 사용자는 서버의 주소를 가진 모든 사람이다.
- 이 사이트에 접속하는 사용자는 오로지 영상 시청만을 요구하기에 시각적 디자인은 필요하지 않다.
- 사이트가 유명하지 않아 사용자가 많진 않지만 가끔씩 수용 범위를 넘어선 사용자가 접속할 수 있다.

---
#### 시스템 구조도
---

![](https://user-images.githubusercontent.com/53927414/209428690-171c32e8-d0ac-4f9c-a1ec-1e75c551376f.png)

- 사용자가 웹 브라우저를 통해 서버에 접근하면, 서버 단에서 동영상 스트리밍 링크를 저장한 데이터베이스에 접근하여 목록과 링크를 제시합니다.
- 사용자가 원하는 동영상을 선택하면, 해당 동영상 스트리밍 링크로 접속합니다.
- 스트리밍 로케이터가 해당 동영상이 저장되어 있는 스토리지(Asset) 을 선택하여 엔드포인트를 통해 사용자에게 전송합니다.



---
#### 적용기술
---
- Ubuntu 20.04 LTS
- Azure VM
- nodeJS
- Azure Media Service
- AWS RDS (MySQL)
- Load balancing

---
#### 개발 과정
---
##### 1. 데이터베이스 설계
AWS 에서 제공하는 RDS 데이터베이스를 이용하였습니다.

![](https://user-images.githubusercontent.com/53927414/209428874-97f25048-165b-4049-8706-209a5c879eb8.png)
video 테이블 구조입니다.

- 영상 제목을 저장할 title
- 스트리밍 서비스를 제공하기 위한 스트리밍 url
- 업로드 날짜

세 개의 컬럼으로 구성되어있습니다.<p>

##### 2. 서버 개발
![](https://user-images.githubusercontent.com/53927414/209429394-fe19bd1c-3595-4807-bb39-6a79361fdf6a.png)
로컬호스트의 8081번 포트로 노드js를 실행하여 서버를 가동시킵니다.<p>

127.0.0.1:8081 에 get 메서드로 접근 시 수행되는 로직 일부입니다.
![](https://user-images.githubusercontent.com/53927414/209429399-fd40482c-9ea1-4bc2-983a-610f85719fa2.png)
데이터베이스와 연동하는 코드는 생략하였습니다.<p>
쿼리를 전송하여 클라이언트에게 HTML 파일로서 전달합니다.<p>

![](https://user-images.githubusercontent.com/53927414/209429449-0a425d9d-8474-4295-a3ba-ee2b5f81df2b.png)
title에 해당 스트리밍 url이 링크되어 있으며, 생성시간 또한 확인 가능합니다.

다음은 동영상 업로드입니다.  
동영상 업로드 클릭 시, localhost:8081/upload 로 이동됩니다.  
html 코드(Form, submit) 및 REST API 분류 코드는 생략하도록 하겠습니다.

![](https://user-images.githubusercontent.com/53927414/209429493-3dd7fbe7-0de3-4427-9f58-a2b24d363c9e.png)
나비가 있는 영상을 업로드 해보겠습니다.  
스트리밍 url은 무료 mp4 사이트에서 가져왔습니다.  
(시간이 지나면 기간이 만료되어 무료 스트리밍 url 이용이 불가해 재빨리 업로드해야 합니다 !!!)  

업로드 함수는 Azure에서 제공하는 코드를 간단히 수정하였습니다. 밑에 설명하겠습니다.

- 제목: 나비
- 스트리밍 url: https://cdn.pixabay.com/vimeo/234530446/%EB%82%98%EB%B9%84%20-%2012060.mp4?width=1280&e xpiry=1671566700&hash=e2a8153d07d50829c530fa8623d299e37b1a7956

![](https://user-images.githubusercontent.com/53927414/209429502-a69d8440-48de-44f5-80a1-fdfaaeca8807.png)  
업로드 중이라는 메시지를 전달 후, 다음은 서버 동작 과정입니다.  

![](https://user-images.githubusercontent.com/53927414/209429506-609d37e2-de67-49e6-ada7-862c756f42ba.png)
제가 입력한 스트리밍 url이 정상적으로 전달되었습니다.  
이제 인코딩 후, Azure의 Media Service의 자산에 업로드 됩니다.  

![](https://user-images.githubusercontent.com/53927414/209429563-bce8099f-d597-40ee-bf81-b5180a97cdda.png)
성공적으로 수행되었습니다!!!  
이후 저의 Azure Media Service에서 제공하는 스트리밍 url이 출력됩니다.  

![](https://user-images.githubusercontent.com/53927414/209429567-8c89f56e-c416-4299-ad35-e7b916bd3c4f.png)
저의 Azure 계정에도 자산(Assets)이 새로 등록되어 있는 것을 확인할 수 있습니다.  

업로드 후에는, 쿼리를 전송하여 AWS RDS에 데이터를 적재합니다.  
첫 줄의 stream.main 함수가 업로드 함수입니다.  
![](https://user-images.githubusercontent.com/53927414/209429618-b44a1359-ea1d-4828-a380-c1b53fc94b42.png)
![](https://user-images.githubusercontent.com/53927414/209429625-aa3629ed-b8d5-44cf-9a27-389f6c7b9b11.png)
데이터베이스에 성공적으로저장되었습니다.  

![](https://user-images.githubusercontent.com/53927414/209429757-8744aa4d-e4e3-4cf1-ae20-cc4aa720491d.png)
나비 영상을 선택해보겠습니다.  

![](https://user-images.githubusercontent.com/53927414/209429768-7d7a5b92-c5a5-4419-b343-9ece82e8bffd.png)
나비 영상이 잘 재생되며, 오른쪽 위에 Microsoft Azure Media Services 워터마크가 생겼습니다.  

![](https://user-images.githubusercontent.com/53927414/209429770-7126e00c-65ab-4c8e-96d8-c92ce45b0e0e.png)
동영상 플레이어의 옵션을 선택하여 일시정지, 타임 리프, 시간 전/후 이동, 재생 속도, 자막, 화질, 소리 크기, 전체화면 기능을 제공합니다.  

GET 메서드로 들어온 쿼리 파라미터를 추출하여 나비 영상의 스트리밍 url을 타겟으로 하여 제가 선택한 동영상 플레이어로 송출하는 개념입니다.  
![](https://user-images.githubusercontent.com/53927414/209429794-8aaafb7a-a814-4dce-bf49-53bf7178c37e.png)


업로드 함수 설명입니다.  
사용한 오픈소스의 출처입니다.  

https://github.com/Azure-Samples/media-services-v3-node-tutorials

코드는 타입스크립트 언어로 작성되어있습니다.  


먼저 보안을 위해 .env 파일에 저의 에져 계정 정보를 작성해놓습니다.  
![](https://user-images.githubusercontent.com/53927414/209429797-de755c1b-7b2c-470c-acd8-31ccd206804a.png)
![](https://user-images.githubusercontent.com/53927414/209429846-8ac8cfb6-a45e-401e-bd70-5746cf122690.png)
오픈소스의 업로드 코드에 저의 에저 계정 정보를 연결시켰습니다.  

![](https://user-images.githubusercontent.com/53927414/209429848-ed11d584-ea86-4bf4-b04b-0fd4a40998c0.png)
이후 main 이라는 이름의 함수를 export 하고, 문자열 url을 인자로 받게 하여 사용자가 입력한 스트리밍 url을 인코딩하도록 바꾸었습니다.  
이 파일을 stream 이라는 변수명으로 import 하여 main 함수에 url을 전달하면 업로드가 수행됩니다.  

##### 3. 배포 및 로드 밸런싱
이제 로컬에서 작업한 코드를 Azure의 VM에 옮기도록 하겠습니다.  

첫 번째 인스턴스 woo-1 입니다.  
![](https://user-images.githubusercontent.com/53927414/209429895-fb836c4d-5165-4f8e-838a-d78997b13ae8.png)

다음으로 두 번째 인스턴스 woo-2 입니다.  
![](https://user-images.githubusercontent.com/53927414/209429896-605c786f-1537-4930-b9d1-9e582430f2bb.png)

두 인스턴스 모두 정상적으로 동작합니다.  

이제 로드 밸런서를 생성합니다.  
학생 계정으로는 최대 두 개의 가상머신밖에 생성하지 못한다고 합니다. (로드 밸런서 포함)

![](https://user-images.githubusercontent.com/53927414/209429924-298d7866-46a2-4412-9e97-c5d65565c36f.png)
![](https://user-images.githubusercontent.com/53927414/209429925-e5f75c8a-58b3-4528-9873-76bc11cbb642.png)

백엔드 풀에 부하 분산을 받을 VM (woo-1, woo-2) 를 추가합니다.  
VM 간의 상태 검사 및 부하 분산 규칙은 HTTP 통신을 통하도록 설정하였습니다.  
인바운드 규칙을 적용하여, 로드 밸런서의 프런트엔드 IP에 접근 시 어떻게 작업을 처리할 지에 대해 작성합니다.   

![](https://user-images.githubusercontent.com/53927414/209429949-0cd85dcf-927a-41d6-aa13-d5d5fffad52e.png)
로드밸런서의 8080번 포트와 백엔드 풀 각각의 VM에 8080 포트를 연결합니다.  
이제 로드밸런서는 두 VM 간의 공용 IP로 부하를 분산할 것입니다.  
그리고 분산 규칙과 상태 프로브는 HTTP(80번 포트)를 사용할 것입니다.  

로드 밸런서가 정상적으로 동작하는지 확인합니다.  
![](https://user-images.githubusercontent.com/53927414/209429951-9dcd4c59-6ff4-411f-bf2b-1b892212ef16.png)
로드밸런서가 부하 분산 규칙에 맞추어 특정 VM을 선택해주었음을 확인할 수 있습니다.
