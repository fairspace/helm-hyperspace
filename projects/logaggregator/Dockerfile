FROM openjdk:11-jre

RUN apt-get update
RUN apt-get install -y procps

ADD build/distributions/*.tar /opt/

WORKDIR "/opt/config"
CMD ["/bin/sh", "-c", "/opt/logaggregator-*/bin/logaggregator -Dlog4j.configuration=file:log4j.properties"]
