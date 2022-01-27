FROM land007/node:latest

MAINTAINER Jia Yiqiu <yiqiujia@hotmail.com>

RUN echo $(date "+%Y-%m-%d_%H:%M:%S") >> /.image_times && \
	echo $(date "+%Y-%m-%d_%H:%M:%S") > /.image_time && \
	echo "land007/tts-server" >> /.image_names && \
	echo "land007/tts-server" > /.image_name

#RUN . $HOME/.nvm/nvm.sh && cd / && npm install basic-auth
ADD node /node_

#docker build -t land007/tts-server:latest .
#docker run -it --restart=always -p 20080:80 --name tts-server land007/tts-server:latest
#> docker buildx build --platform linux/amd64,linux/arm64/v8,linux/arm/v7 -t land007/tts-server:latest --push .

